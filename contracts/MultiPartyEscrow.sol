pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract MultiPartyEscrow {
    
    using SafeMath for uint256;
    
    //TODO: we could use uint64 for value, nonce and expiration (it could be cheaper to store but more expensive to operate with)
    //the full ID of "atomic" payment channel = "[this, channelId, nonce]"
    struct PaymentChannel {
        uint256 nonce;       // "nonce" of the channel (by changing nonce we effectivly close the old channel ([this, channelId, oldNonce])
                             //  and open the new channel [this, channelId, newNonce])
                             //!!! nonce also prevents race conditon between channelClaim and channelExtendAndAddFunds
        address sender;      // The account sending payments.
        address signer;      // signer on behalf of sender
        address recipient;   // The account receiving the payments.
        bytes32 groupId;     // id of group of replicas who share the same payment channel
                             // You should generate groupId randomly in order to prevent
                             // two PaymentChannel with the same [recipient, groupId]
        uint256 value;       // Total amount of tokens deposited to the channel. 
        uint256 expiration;  // Timeout (in block numbers) in case the recipient never closes.
                             // if block.number > expiration then sender can call channelClaimTimeout
    }


    mapping (uint256 => PaymentChannel) public channels;
    mapping (address => uint256)        public balances; //tokens which have been deposit but haven't been escrowed in the channels
   
    uint256 public nextChannelId; //id of the next channel (and size of channels)
 
    ERC20 public token; // Address of token contract
    
    //already used messages for openChannelByThirdParty in order to prevent replay attack
    mapping (bytes32 => bool) public usedMessages; 

    // Events
    event ChannelOpen(uint256 channelId, uint256 nonce, address indexed sender, address signer, address indexed recipient, bytes32 indexed groupId, uint256 amount, uint256 expiration);
    event ChannelClaim(uint256 indexed channelId, uint256 nonce, address indexed recipient, uint256 claimAmount, uint256 plannedAmount, uint256 sendBackAmount, uint256 keepAmount);
    event ChannelSenderClaim(uint256 indexed channelId, uint256 nonce, uint256 claimAmount);
    event ChannelExtend(uint256 indexed channelId, uint256 newExpiration);
    event ChannelAddFunds(uint256 indexed channelId, uint256 additionalFunds);
    event DepositFunds(address indexed sender, uint256 amount);
    event WithdrawFunds(address indexed sender, uint256 amount);
    event TransferFunds(address indexed sender, address indexed receiver, uint256 amount);

    constructor (address _token)
    public
    {
        token = ERC20(_token);
    }
  
    function deposit(uint256 value) 
    public
    returns(bool) 
    {
        require(token.transferFrom(msg.sender, this, value), "Unable to transfer token to the contract."); 
        balances[msg.sender] = balances[msg.sender].add(value);
        emit DepositFunds(msg.sender, value);
        return true;
    }
    
    function withdraw(uint256 value)
    public
    returns(bool)
    {
        require(balances[msg.sender] >= value, "Insufficient balance in the contract.");
        require(token.transfer(msg.sender, value), "Unable to transfer token to the contract.");
        balances[msg.sender] = balances[msg.sender].sub(value);
        emit WithdrawFunds(msg.sender, value);
        return true;
    }
    
    function transfer(address receiver, uint256 value)
    public
    returns(bool)
    {
        require(balances[msg.sender] >= value, "Insufficient balance in the contract");
        balances[msg.sender] = balances[msg.sender].sub(value);
        balances[receiver] = balances[receiver].add(value);

        emit TransferFunds(msg.sender, receiver, value);
        return true;
    }
    
    
    //open a channel, token should be already being deposit
    //openChannel should be run only once for given sender, recipient, groupId
    //channel can be reused even after channelClaim(..., isSendback=true)
    function openChannel(address signer, address recipient, bytes32 groupId, uint256 value, uint256 expiration)
    public
    returns(bool)
    {
        require(balances[msg.sender] >= value, "Insufficient balance in the contract.");
        require(signer != address(0));

        require(_openChannel(msg.sender, signer, recipient, groupId, value, expiration), "Unable to open channel");
        return true;
    }
    
    //open a channel on behalf of the user. Sender should send the signed permission to open the channel
    function openChannelByThirdParty(address sender, address signer, address recipient, bytes32 groupId, uint256 value, uint256 expiration, uint256 messageNonce, uint8 v, bytes32 r, bytes32 s) 
    public
    returns(bool) 
    {
        require(balances[msg.sender] >= value, "Insufficient balance");

        // Blocks seems to take variable time based on network congestion for now removing it. Message nounce will be a blocknumber
        //require(messageNonce >= block.number-5 && messageNonce <= block.number+5, "Invalid message nonce");

        //compose the message which was signed
        bytes32 message = prefixed(keccak256(abi.encodePacked("__openChannelByThirdParty", this, msg.sender, signer, recipient, groupId, value, expiration, messageNonce)));
        
        //check for replay attack (message can be used only once)
        require( ! usedMessages[message], "Signature has already been used");
        usedMessages[message] = true;

        // check that the signature is from the "sender"
        require(ecrecover(message, v, r, s) == sender, "Invalid signature");

        require(_openChannel(sender, signer, recipient, groupId, value, expiration), "Unable to open channel");
        
        return true;
    }

    function _openChannel(address sender, address signer, address recipient, bytes32 groupId, uint256 value, uint256 expiration)
    private
    returns(bool)
    {
        channels[nextChannelId] = PaymentChannel({
            nonce        : 0,
            sender       : sender,
            signer       : signer,
            recipient    : recipient,
            groupId      : groupId,
            value        : value,
            expiration   : expiration
        });
      
        balances[msg.sender] = balances[msg.sender].sub(value);
        emit ChannelOpen(nextChannelId, 0, sender, signer, recipient, groupId, value, expiration);
        nextChannelId += 1;
        return true;
    }

    function depositAndOpenChannel(address signer, address recipient, bytes32 groupId, uint256 value, uint256 expiration)
    public
    returns(bool)
    {
        require(deposit(value), "Unable to deposit token to the contract.");
        require(openChannel(signer, recipient, groupId, value, expiration), "Unable to open channel.");
        return true;
    }


    function _channelSendbackAndReopenSuspended(uint256 channelId)
    private
    {
        PaymentChannel storage channel = channels[channelId];

        balances[channel.sender] = balances[channel.sender].add(channel.value); 
        channel.value            = 0;
        channel.nonce           += 1;
        channel.expiration       = 0;
    }

    /**
     * @dev function to claim multiple channels at a time. Needs to send limited channels per call
     * @param channelIds list of channel Ids
     * @param actualAmounts list of actual amounts should be aligned with channel ids index
     * @param plannedAmounts list of planned amounts should be aligned with channel ids index
     * @param isSendbacks list of sendbacks flags
     * @param v channel senders signatures in V R S for each channel
     * @param r channel senders signatures in V R S for each channel
     * @param s channel senders signatures in V R S for each channel
     */
    function multiChannelClaim(uint256[] channelIds, uint256[] actualAmounts, uint256[] plannedAmounts, bool[] isSendbacks, uint8[] v, bytes32[] r, bytes32[] s) 
    public 
    {
        uint256 len = channelIds.length;
        
        require(plannedAmounts.length == len && actualAmounts.length == len && isSendbacks.length == len && v.length == len && r.length == len && s.length == len, "Invalid function parameters.");
        for(uint256 i=0; i<len ; i++) {
            channelClaim(channelIds[i], actualAmounts[i], plannedAmounts[i], v[i], r[i], s[i], isSendbacks[i]);
        }
        
    }

    function channelClaim(uint256 channelId, uint256 actualAmount, uint256 plannedAmount, uint8 v, bytes32 r, bytes32 s, bool isSendback) 
    public 
    {
        PaymentChannel storage channel = channels[channelId];
        require(actualAmount <= channel.value, "Insufficient channel amount");
        require(msg.sender == channel.recipient, "Invalid recipient");
        require(actualAmount <= plannedAmount, "Invalid actual amount");
        
        //compose the message which was signed
        bytes32 message = prefixed(keccak256(abi.encodePacked("__MPE_claim_message", this, channelId, channel.nonce, plannedAmount)));
        // check that the signature is from the signer
        address signAddress = ecrecover(message, v, r, s);
        require(signAddress == channel.signer || signAddress == channel.sender, "Invalid signature");
        
        //transfer amount from the channel to the sender
        channel.value        =        channel.value.sub(actualAmount);
        balances[msg.sender] = balances[msg.sender].add(actualAmount);
   
        if (isSendback)    
            {
                _channelSendbackAndReopenSuspended(channelId);
                emit ChannelClaim(channelId, channel.nonce, msg.sender, actualAmount, plannedAmount, channel.value, 0);
            }
            else
            {
                //reopen new "channel", without sending back funds to "sender"        
                channel.nonce += 1;
                emit ChannelClaim(channelId, channel.nonce, msg.sender, actualAmount, plannedAmount, 0, channel.value);
            }
    }



    /// the sender can extend the expiration at any time
    function channelExtend(uint256 channelId, uint256 newExpiration) 
    public 
    returns(bool)
    {
        PaymentChannel storage channel = channels[channelId];

        require(msg.sender == channel.sender, "Sender not authorized");
        require(newExpiration >= channel.expiration, "Invalid expiration.");

        channels[channelId].expiration = newExpiration;
        
        emit ChannelExtend(channelId, newExpiration);
        return true;
    }
    
    /// the sender could add funds to the channel at any time
    /// any one can fund the channel irrespective of the sender
    function channelAddFunds(uint256 channelId, uint256 amount)
    public
    returns(bool)
    {
        require(balances[msg.sender] >= amount, "Insufficient balance in the contract");

        //tranfser amount from sender to the channel
        balances[msg.sender]      = balances[msg.sender].sub     (amount);
        channels[channelId].value = channels[channelId].value.add(amount);
        
        emit ChannelAddFunds(channelId, amount);
        return true;
    }

    function channelExtendAndAddFunds(uint256 channelId, uint256 newExpiration, uint256 amount)
    public
    {
        require(channelExtend(channelId, newExpiration), "Unable to extend the channel.");
        require(channelAddFunds(channelId, amount), "Unable to add funds to channel.");
    }
    
    // sender can claim refund if the timeout is reached 
    function channelClaimTimeout(uint256 channelId) 
    public 
    {
        require(msg.sender == channels[channelId].sender, "Sender not authorized.");
        require(block.number >= channels[channelId].expiration, "Claim called too early.");
        _channelSendbackAndReopenSuspended(channelId);
        
        emit ChannelSenderClaim(channelId, channels[channelId].nonce, channels[channelId].value);
    }


    /// builds a prefixed hash to mimic the behavior of ethSign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) 
    {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
    
    
}