pragma solidity ^0.4.18;


contract AgentRegistryInterface {

    event AgentAdded(uint id, address agent);

    function getAgentsWithService(uint service) external constant returns (uint[]);
    function getAgent(uint id) external constant returns (address);
    function addAgent(
        uint service, 
        uint unit, 
        uint price, 
        address agent) external;

}
