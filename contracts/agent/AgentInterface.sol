pragma solidity ^0.4.11;

contract AgentInterface {

    function sendPacket(address target, bytes packet) external;
    function appendPacket(bytes packet) external;
    function getPacket(uint id) external constant returns (bytes);
}
