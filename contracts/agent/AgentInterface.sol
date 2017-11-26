pragma solidity ^0.4.18;

import "../market/MarketJob.sol";

contract AgentInterface {

    function sendPacket(address target, bytes packet) external;
    function appendPacket(bytes packet) external;
    function getPacket(uint id) external constant returns (bytes);
    function setJob(MarketJob _job) external returns (address);
    
}
