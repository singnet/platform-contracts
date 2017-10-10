pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/token/StandardToken.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";

/**
 * @title Singularity Network Token
 * @dev ERC20 Singularity Network Token (SIN)
 *
 * SIN Tokens are divisible by 1e8 (100,000,000) base
 * units referred to as 'unit'.
 *
 * SIN are displayed using 8 decimal places of precision.
 *
 * 1 SIN is equivalent to:
 *   100000000 == 1 * 10**8 == 1e8 == One Hundred Million units
 *
 * 1 Billion SIN (total supply) is equivalent to:
 *   100000000000000000 == 1000000000 * 10**8 == 1e17 == One Hundred Quadrillion units
 *
 * All initial SIN units are assigned to the creator of
 * this contract.
 *
 */
contract SingularityNetToken is StandardToken, Pausable {

    string public constant NAME = "Singularity Network Token";
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
