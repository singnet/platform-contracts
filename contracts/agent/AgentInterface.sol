pragma solidity ^0.4.15;

contract AgentInterface {

    function sendPacket(address target, bytes packet) external;
    function appendPacket(bytes packet) external;
    function getPacket(uint id) external constant returns (bytes);
    function appendJob(address[] agents, uint[] amounts, address payer, bytes firstPacket, bytes lastPacket) external constant returns (address);
    
}
