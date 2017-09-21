pragma solidity ^0.4.11;

import "./AgentRegistryInterface.sol";

contract AgentRegistry is AgentRegistryInterface {

    address[] public agents;

    mapping (uint => uint[]) agentsForService;

    function getAgentsWithService(uint service) external constant returns (uint[]) {
        return agentsForService[service];
    }

    function getAgent(uint id) external constant returns (address) {
        return agents[id];
    }

    function addAgent(uint service, address agent) external {
        uint id = agents.length;

        agents.push(agent);
        agentsForService[service].push(id);

        AgentAdded(id, agent);
    }
}
