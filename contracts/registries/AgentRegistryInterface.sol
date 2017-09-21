pragma solidity ^0.4.11;

contract AgentRegistryInterface {

    event AgentAdded(uint id, address agent);

    function getAgentsWithService(uint service) external constant returns (uint[]);
    function getAgent(uint id) external constant returns (address);
    function addAgent(uint id, address) external;

}
