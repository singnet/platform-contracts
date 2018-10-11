pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MultiPartyEscrow {
    
    //it seems we don't need SafeMath
    //using SafeMath for uint256;
    

    //TODO: we could use uint64 for replicaId and nonce (it could be cheaper to store but more expensive to operate with)

    //the full ID of "atomic" payment channel = "[this, channelId, nonce]"
    struct PaymentChannel {
        address sender;      // The account sending payments.
        address recipient;    // The account receiving the payments.
        uint256 replicaId;   // id of particular service replica
        uint256 value;       // Total amount of tokens deposited to the channel. 
        uint256 nonce;       // "nonce" of the channel (by changing nonce we effectivly close the old channel ([this, channelId, oldNonce])
                             //  and open the new channel [this, channelId, newNonce])
                             //!!! nonce also prevents race conditon between channelClaim and channelExtendAndAddFunds 
        uint256 expiration;  // Timeout (in block numbers) in case the recipient never closes.
                             // if block.number > expiration then sender can call channelClaimTimeout
    }


    mapping (uint256 => PaymentChannel) public channels;
    mapping (address => uint256)        public balances; //tokens which have been deposit but haven't been escrowed in the channels
   
    uint256 public nextChannelId; //id of the next channel (and size of channels)
 
    ERC20 public token; // Address of token contract
    
    //TODO: optimize events. Do we need more (or less) events?
    event EventChannelOpen       (uint256 channelId,         address indexed sender, address indexed recipient, uint256 indexed replicaId);
    //event EventChannelReopen     (uint256 channelId,         address indexed sender, address indexed recipient, uint256 indexed replicaId, uint256 nonce);
    //event EventChannelTorecipient(uint256 indexed channelId, address indexed sender, address indexed recipient, uint256 amount);
    //event EventChannelTosender   (uint256 indexed channelId, address indexed sender, address indexed recipient, uint256 amount);

    constructor (address _token)
    public
    {
        token = ERC20(_token);
    }
  
    function deposit(uint256 value) 
    public
    returns(bool) 
    {
        require(token.transferFrom(msg.sender, this, value), "Unable to transfer token to the contract");
        balances[msg.sender] += value;
        return true;
    }
    
    function withdraw(uint256 value)
    public
    returns(bool)
    {
        require(balances[msg.sender] >= value);
        require(token.transfer(msg.sender, value));
        balances[msg.sender] -= value;
        return true;
    }
    
    //open a channel, token should be already being deposit
    //openChannel should be run only once for given sender, recipient, replicaId
    //channel can be reused even after channelClaim(..., isSendback=true)
    function openChannel(address  recipient, uint256 value, uint256 expiration, uint256 replicaId) 
    public
    returns(bool) 
    {
        require(balances[msg.sender] >= value);
        channels[nextChannelId] = PaymentChannel({
            sender       : msg.sender,
            recipient    : recipient,
            value        : value,
            replicaId    : replicaId,
            nonce        : 0,
            expiration   : expiration
        });
        balances[msg.sender] -= value;
        emit EventChannelOpen(nextChannelId, msg.sender, recipient, replicaId);
        nextChannelId += 1;
        return true;
    }
    


    function depositAndOpenChannel(address  recipient, uint256 value, uint256 expiration, uint256 replicaId)
    public
    returns(bool)
    {
        require(deposit(value));
        require(openChannel(recipient, value, expiration, replicaId));
        return true;
    }


    function _channelSendbackAndReopenSuspended(uint256 channelId)
    private
    {
        PaymentChannel storage channel = channels[channelId];
        balances[channel.sender]      += channel.value; 
        channel.value                  = 0;
        channel.nonce                 += 1;
        channel.expiration             = 0;
    }

    // the recipient can close the channel at any time by presenting a
    // signed amount from the sender. The recipient will be sent that amount. The recipient can choose: 
    // send the remainder to the sender (isSendback == true), or put that amount into the new channel.
    function channelClaim(uint256 channelId, uint256 amount, bytes memory signature, bool isSendback) 
    public 
    {
        PaymentChannel storage channel = channels[channelId];
        require(amount <= channel.value);
        require(msg.sender == channel.recipient);
        
        //compose the message which was signed
        bytes32 message = prefixed(keccak256(abi.encodePacked(this, channelId, channel.nonce, amount)));
        // check that the signature is from the channel.sender
        require(recoverSigner(message, signature) == channel.sender);
         
        balances[msg.sender]      += amount;
        channels[channelId].value -= amount;
    
        if (isSendback)    
            {
                _channelSendbackAndReopenSuspended(channelId);
            }
            else
            {
                //reopen new "channel", without sending back funds to "sender"        
                channels[channelId].nonce += 1;
            }
    }


    /// the sender can extend the expiration at any time
    function channelExtend(uint256 channelId, uint256 newExpiration) 
    public 
    returns(bool)
    {
        PaymentChannel storage channel = channels[channelId];

        require(msg.sender == channel.sender);
        require(newExpiration >= channel.expiration);

        channels[channelId].expiration = newExpiration;
        return true;
    }
    
    /// the sender could add funds to the channel at any time
    function channelAddFunds(uint256 channelId, uint256 amount)
    public
    returns(bool)
    {
        require(balances[msg.sender] >= amount);
        
        PaymentChannel storage channel = channels[channelId];
        
        //TODO: we could remove this require and allow everybody to funds it
        require(msg.sender == channel.sender);

        channels[channelId].value += amount;
        balances[msg.sender]      -= amount;
        return true;
    }

    function channelExtendAndAddFunds(uint256 channelId, uint256 newExpiration, uint256 amount)
    public
    {
        require(channelExtend(channelId, newExpiration));
        require(channelAddFunds(channelId, amount));
    }
    
    // sender can claim refund if the timeout is reached 
    function channelClaimTimeout(uint256 channelId) 
    public 
    {
        require(msg.sender == channels[channelId].sender);
        require(block.number >= channels[channelId].expiration);
        _channelSendbackAndReopenSuspended(channelId);
    }

    function splitSignature(bytes memory sig)
    internal
    pure
    returns (uint8 v, bytes32 r, bytes32 s)
    {
        require(sig.length == 65);

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte
            v := and(mload(add(sig, 65)), 255)
        }
        
        if (v < 27) v += 27;

        return (v, r, s);
    }

    function recoverSigner(bytes32 message, bytes memory sig)
    internal
    pure
    returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    /// builds a prefixed hash to mimic the behavior of ethSign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) 
    {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}
