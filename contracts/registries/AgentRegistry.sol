pragma solidity ^0.4.18;

import "./AgentRegistryInterface.sol";


contract AgentRegistry is AgentRegistryInterface {

    struct Service {
        uint unit;
        uint pricePerUnit;
    }

    address[] public agents;

    mapping (uint => Service[]) services;

    mapping (uint => uint[]) agentsForService;

    function getAgentsWithService(uint service) external constant returns (uint[]) {
        return agentsForService[service];
    }

    function getAgent(uint id) external constant returns (address) {
        return agents[id];
    }

    function addAgent(
        uint service, 
        uint unit, 
        uint price, 
        address agent ) external 
    {
        services[service].push(Service(unit, price));
        
        uint id = agents.length;

        agents.push(agent);
        agentsForService[service].push(id);

        AgentAdded(id, agent);
    }
}
