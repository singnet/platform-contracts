pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/token/StandardToken.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";

/**
 * @title SingularityNET Token
 * @dev ERC20 SingularityNET Token (AGI)
 *
 * AGI Tokens are divisible by 1e8 (100,000,000) base
 * spikes referred to as 'spike'.
 *
 * AGI are displayed using 8 decimal places of precision.
 *
 * 1 AGI is equivalent to:
 *   100000000 == 1 * 10**8 == 1e8 == One Hundred Million spikes
 *
 * 1 Billion AGI (total supply) is equivalent to:
 *   100000000000000000 == 1000000000 * 10**8 == 1e17 == One Hundred Quadrillion spikes
 *
 *
 */
contract SingularityNetToken is StandardToken, Pausable {

    string public constant NAME = "SingularityNET Token";
    string public constant SYMBOL = "AGI";
    uint8 public constant DECIMALS = 8;
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**uint256(DECIMALS);

    /**
    * @dev SingularityNetToken Constructor
    */
    function SingularityNetToken() {
        totalSupply = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
    }

    function transfer(address to, uint256 value) whenNotPaused returns (bool) {
        require(to != address(0));
        return super.transfer(to, value);
    }

    function transferFrom(address from, address to, uint256 value) whenNotPaused returns (bool) {
        require(to != address(0));
        return super.transferFrom(from, to, value);
    }

    function approve(address spender, uint256 value) whenNotPaused returns (bool) {
        return super.approve(spender, value);
    }

}
