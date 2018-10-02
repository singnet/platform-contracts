pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MultiPartyEscrow {
    
    //it seems we don't need SafeMath
   //using SafeMath for uint256;
    

    //TODO: we could use uint64 for replica_id and nonce (it could be cheaper to store but more expensive to operate with)

    //the full ID of "atomic" payment channel = "[this, channel_id, nonce]"
    struct PaymentChannel {
        address sender;      // The account sending payments.
        address recipient;    // The account receiving the payments.
        uint256 replica_id;  // id of particular service replica
        uint256 value;       // Total amount of tokens deposited to the channel. 
        uint256 nonce;       // "nonce" of the channel (by changing nonce we effectivly close the old channel ([this, channel_id, old_nonce])
                             //  and open the new channel [this, channel_id, new_nonce])
                             //!!! nonce also prevents race conditon between channel_claim and channel_extend_and_add_funds 
        uint256 expiration;  // Timeout in case the recipient never closes.
    }


    mapping (uint256 => PaymentChannel) public channels;
    mapping (address => uint256)        public balances; //tokens which have been deposit but haven't been escrowed in the channels
   
    //already used messages for open_channel_by_recipient in order to prevent replay attack
    mapping (bytes32 => bool) public used_messages; 

    uint256 public next_channel_id; //id of the next channel (and size of channels)
 
    ERC20 public token; // Address of token contract
    
    //TODO: optimize events. Do we need more (or less) events?
    event event_channel_open       (uint256 channel_id,         address indexed sender, address indexed recipient, uint256 indexed replica_id);
    //event event_channel_reopen     (uint256 channel_id,         address indexed sender, address indexed recipient, uint256 indexed replica_id, uint256 nonce);
    //event event_channel_torecipient(uint256 indexed channel_id, address indexed sender, address indexed recipient, uint256 amount);
    //event event_channel_tosender   (uint256 indexed channel_id, address indexed sender, address indexed recipient, uint256 amount);

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
    //open_channel should be run only once for given sender, recipient, replica_id
    //channel can be reused even after channel_claim(..., is_sendback=true)
    function open_channel(address  recipient, uint256 value, uint256 expiration, uint256 replica_id) 
    public
    returns(bool) 
    {
        require(balances[msg.sender] >= value);
        channels[next_channel_id] = PaymentChannel({
            sender       : msg.sender,
            recipient    : recipient,
            value        : value,
            replica_id   : replica_id,
            nonce        : 0,
            expiration   : expiration
        });
        balances[msg.sender] -= value;
        emit event_channel_open(next_channel_id, msg.sender, recipient, replica_id);
        next_channel_id += 1;
        return true;
    }
    


    function deposit_and_open_channel(address  recipient, uint256 value, uint256 expiration, uint256 replica_id)
    public
    returns(bool)
    {
        require(deposit(value));
        require(open_channel(recipient, value, expiration, replica_id));
        return true;
    }

    //open a channel from the recipient side. Sender should send the signed permission to open the channel
    function open_channel_by_recipient(address  sender, uint256 value, uint256 expiration, uint256 replica_id, uint256 message_nonce, bytes memory signature) 
    public
    returns(bool) 
    {
        require(balances[sender] >= value);
        require(isValidSignature_open_channel_replaysafe(msg.sender, value, expiration, replica_id, message_nonce, signature, sender));

        channels[next_channel_id] = PaymentChannel({
            sender       : sender,
            recipient    : msg.sender,
            value        : value,
            replica_id   : replica_id,
            nonce        : 0,
            expiration   : expiration
        });
        balances[sender] -= value;

        emit event_channel_open(next_channel_id, sender, msg.sender, replica_id);
        next_channel_id += 1;
        return true;
    }
 
    function _channel_sendback_and_reopen(uint256 channel_id)
    private
    {
        PaymentChannel storage channel = channels[channel_id];
        balances[channel.sender]      += channel.value; 
        channel.value                  = 0;
        channel.nonce                 += 1;
        channel.expiration             = 0;
    }

    // the recipient can close the channel at any time by presenting a
    // signed amount from the sender. The recipient will be sent that amount. The recipient can choose: 
    // send the remainder to the sender (is_sendback == true), or put that amount into the new channel.
    function channel_claim(uint256 channel_id, uint256 amount, bytes memory signature, bool is_sendback) 
    public 
    {
        PaymentChannel storage channel = channels[channel_id];
        require(amount <= channel.value);
        require(msg.sender == channel.recipient);
 
        //message which was signed contains the address of MPE contract ("this"), but we will add it later.
        require(isValidSignature_claim(channel_id, channel.nonce, amount, signature, channel.sender));
        
        balances[msg.sender]       += amount;
        channels[channel_id].value -= amount;
    
        if (is_sendback)    
            {
                _channel_sendback_and_reopen(channel_id);
            }
            else
            {
                //reopen new "channel", without sending back funds to "sender"        
                channels[channel_id].nonce += 1;
            }
    }


    /// the sender can extend the expiration at any time
    function channel_extend(uint256 channel_id, uint256 new_expiration) 
    public 
    returns(bool)
    {
        PaymentChannel storage channel = channels[channel_id];

        require(msg.sender == channel.sender);
        require(new_expiration > channel.expiration);

        channels[channel_id].expiration = new_expiration;
        return true;
    }
    
    /// the sender could add funds to the channel at any time
    function channel_add_funds(uint256 channel_id, uint256 amount)
    public
    returns(bool)
    {
        require(balances[msg.sender] >= amount);
        
        PaymentChannel storage channel = channels[channel_id];
        
        //TODO: we could remove this require and allow everybody to funds it
        require(msg.sender == channel.sender);

        channels[channel_id].value += amount;
        balances[msg.sender]       -= amount;
        return true;
    }

    function channel_extend_and_add_funds(uint256 channel_id, uint256 new_expiration, uint256 amount)
    public
    {
        require(channel_extend(channel_id, new_expiration));
        require(channel_add_funds(channel_id, amount));
    }
    
    // sender can claim refund if the timeout is reached 
    function channel_claim_timeout(uint256 channel_id) 
    public 
    {
        require(msg.sender == channels[channel_id].sender);
        require(now >= channels[channel_id].expiration);
        _channel_sendback_and_reopen(channel_id);
    }


    function isValidSignature_open_channel_replaysafe(address recipient, uint256 value, uint256 expiration, uint256 replica_id, uint256 message_nonce, bytes memory signature, address sender)
    internal
	returns (bool)
    {
        bytes32 message = prefixed(keccak256(abi.encodePacked(this, recipient, value, expiration, replica_id, message_nonce)));
        
        //check for replay attack
        if (used_messages[message]) return false;
        
        //store this message. It will prevent replay of this message
        used_messages[message] = true;

        // check that the signature is from the "sender"
        return recoverSigner(message, signature) == sender;
    }

    function isValidSignature_claim(uint256 channel_id, uint256 nonce, uint256 amount, bytes memory signature, address sender)
    internal
    view
	returns (bool)
    {
        bytes32 message = prefixed(keccak256(abi.encodePacked(this, channel_id, nonce, amount)));
        // check that the signature is from the payment sender
        return recoverSigner(message, signature) == sender;
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

    /// builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) 
    {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}
