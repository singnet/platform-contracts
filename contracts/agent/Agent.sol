pragma solidity ^0.4.18;

import "./AgentInterface.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Agent is AgentInterface, Ownable {

    bytes[] public packets;
    MarketJobInterface public job;

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
