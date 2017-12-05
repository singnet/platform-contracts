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

    function SingularityNetToken() {
        totalSupply = INITIAL_SUPPLY;   
        balances[msg.sender] = INITIAL_SUPPLY;
    }

    function setOwnership(address _owner) onlyOwner {
        require(_owner != owner);
        require(address(_owner) != address(0));
        pause();
        //assign to current owner 
        balances[owner] = INITIAL_SUPPLY.sub(PUBLIC_SUPPLY);
        transferOwnership(_owner);
        require(_owner == owner);        
        balances[owner] = PUBLIC_SUPPLY;
    } 

    function transferTokens(address beneficiary, uint256 amount) onlyOwner returns (bool) {
        require(amount > 0);

        balances[owner] = balances[owner].sub(amount);
        balances[beneficiary] = balances[beneficiary].add(amount);
        Transfer(owner, beneficiary, amount);

        return true;
    }
}
