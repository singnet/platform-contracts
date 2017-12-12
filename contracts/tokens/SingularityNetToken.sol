pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/PausableToken.sol";
import "zeppelin-solidity/contracts/token/BurnableToken.sol";


/**
 * @title SingularityNET Token
 * @dev ERC20 SingularityNET Token (AGI)
 *
 * AGI Tokens are divisible by 1e8 (100,000,000) base
 * referred to as 'cogs'.
 *
 * AGI are displayed using 8 decimal places of precision.
 *
 * 1 AGI is equivalent to:
 *   100 000 000 == 1 * 10**8 == 1e8 == One Hundred Million cogs
 *
 * 1 Billion AGI (total supply) is equivalent to:
 *   100000000000000000 == 1 000 000 000 * 10**8 == 1e17 == One Hundred Quadrillion cogs
 *
 *
 */
contract SingularityNetToken is PausableToken, BurnableToken {

    string public constant NAME = "SingularityNET Token";
    string public constant SYMBOL = "AGI";
    uint8 public constant DECIMALS = 8;
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**uint256(DECIMALS);
    uint256 public constant PRIVATE_SUPPLY =  100000000 * 10**uint256(DECIMALS);
    uint256 public constant FOUNDER_SUPPLY =  500000000 * 10**uint256(DECIMALS); 
    uint256 public constant PUBLIC_SUPPLY  =  400000000 * 10**uint256(DECIMALS);
    
    /**
    * @dev SingularityNetToken Constructor
    */

    event Deposited(address payer, address beneficiary, uint256 amount);

    function SingularityNetToken() public {
        totalSupply = INITIAL_SUPPLY;   
        balances[msg.sender] = INITIAL_SUPPLY;
    }

    function setOwnership(address _owner) public onlyOwner {
        require(_owner != owner);
        require(address(_owner) != address(0));
        pause();
        //assign to current owner 
        balances[owner] = INITIAL_SUPPLY.sub(PUBLIC_SUPPLY);
        transferOwnership(_owner);
        require(_owner == owner);        
        balances[owner] = PUBLIC_SUPPLY;
    } 

    function transferTokens(address beneficiary, uint256 amount) public onlyOwner returns (bool) {
        require(amount > 0);

        balances[owner] = balances[owner].sub(amount);
        balances[beneficiary] = balances[beneficiary].add(amount);
        Transfer(owner, beneficiary, amount);

        return true;
    }

    function transferSenderTokensTo(address beneficiary, uint256 amount) public returns (bool) {
        require(amount > 0);

        balances[msg.sender] = balances[msg.sender].sub(amount);
        balances[beneficiary] = balances[beneficiary].add(amount);
        Transfer(msg.sender, beneficiary, amount);

        return true;
    }

    /** - copied from StandardToken
    * @dev Transfer tokens from one address to another
    * @param _from address The address which you want to send tokens from
    * @param _to address The address which you want to transfer to
    * @param _value uint256 the amount of tokens to be transferred
    */
    function transferFromSingnet(address _from, address _to, uint256 _value) public returns (bool) {
//        require(_to != address(0));
//        require(_value <= balances[_from]);
//        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    function isPaused() public view returns (bool) {

        return paused;
    }

    function getSender() public view returns (address) {

        return msg.sender;
    }

    function getOwner() public view returns (address) {

        return owner;
    }

    function checkOwnerBalance() public view returns (uint256) {

        return balances[owner];
    }

    function checkSenderBalance() public view returns (uint256) {

        return balances[msg.sender];
    }

    function checkBalance(address account) public view returns (uint256) {

        return balances[account];
    }

}
