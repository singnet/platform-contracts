pragma solidity ^0.4.18;

import "../../contracts/foundation/AgiCrowdsale.sol";

contract AgiCrowdsaleMock is AgiCrowdsale {
    uint256 public timeStamp = now;
    function setBlockTimestamp(uint256 _timeStamp) public onlyOwner {
        timeStamp = _timeStamp;
    }

    function getBlockTimestamp() internal constant returns (uint256) {
        return timeStamp;
    }
  
    function AgiCrowdsaleMock(
        address _token, 
        address _wallet, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rate, 
        uint256 _cap, 
        uint256 _goal) 
        AgiCrowdsale(_token, _wallet, _startTime, _endTime, _rate, _cap, _goal)
    {
    }

}