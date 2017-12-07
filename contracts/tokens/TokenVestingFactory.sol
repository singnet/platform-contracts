pragma solidity ^0.4.18;

import "./TokenVesting.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract TokenVestingFactory is Ownable {

    event Created(TokenVesting vesting);

    function create(address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration, bool _revocable) onlyOwner public returns (TokenVesting) {

        TokenVesting vesting = new TokenVesting(_beneficiary, _start, _cliff, _duration, _revocable);

        Created(vesting);

        return vesting;
    }

}