pragma solidity ^0.4.15;

import "./AgentInterface.sol";
// import "../marketjob/MarketJobInterface.sol";
import "../ownership/ownable.sol";

contract Agent is AgentInterface, ownable {

    bytes[] public packets;
    MarketJobInterface public job;

    function() payable { }

    function sendPacket(address target, bytes packet) external onlyOwner {
        Agent(target).appendPacket(packet);
    }

    // @todo only people who can
    function appendPacket(bytes packet) external {
        packets.push(packet);
    }

    function getPacket(uint id) external constant returns (bytes) {
        return packets[id];
    }

    function setJob(MarketJob _job) external returns (address) {
        job = _job;
    }

}
