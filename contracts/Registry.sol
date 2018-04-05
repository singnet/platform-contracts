pragma solidity ^0.4.21;

import "./Agent.sol";

contract Registry {
    enum RecordStatus {
        ACTIVE,
        DISABLED,
        DEPRECATED
    }

    struct AgentRecord {
        address agent;
        address owner;
        bytes32 name;
        RecordStatus status;
    }

    AgentRecord[] public agentRecords;
    mapping(bytes32 => uint) public agentIndex;

    event AgentRegistered(bytes32 name, address agent);
    event AgentEnabled(bytes32 name);
    event AgentDisabled(bytes32 name);
    event AgentDeprecated(bytes32 name);
    event AgentUpdated(bytes32 name, address agent);

    function Registry() public {
        // The 0th index of this list cannot be used because of the fact that agentIndex[name] == 0 when
        // name is *not* valid
        agentRecords.push(AgentRecord(address(0), address(0), "", RecordStatus.DEPRECATED));
    }

    function registerAgent(bytes32 name, address agent) public {
        require(agentIndex[name] == 0);
        address owner = tx.origin;
        require(Agent(agent).owner() == owner);
        agentIndex[name] = agentRecords.push(AgentRecord(agent, owner, name, RecordStatus.ACTIVE)) - 1;
        emit AgentRegistered(name, agent);
    }

    function enableAgent(bytes32 name) public {
        uint index = agentIndex[name];
        require(index != 0);
        require(agentRecords[index].owner == tx.origin);
        require(agentRecords[index].status == RecordStatus.DISABLED);
        agentRecords[index].status = RecordStatus.ACTIVE;
        emit AgentEnabled(name);
    }

    function disableAgent(bytes32 name) public {
        uint index = agentIndex[name];
        require(index != 0);
        require(agentRecords[index].owner == tx.origin);
        require(agentRecords[index].status == RecordStatus.ACTIVE);
        agentRecords[index].status = RecordStatus.DISABLED;
        emit AgentDisabled(name);
    }

    function deprecateAgent(bytes32 name) public {
        uint index = agentIndex[name];
        require(index != 0);
        require(agentRecords[index].owner == tx.origin);
        require(agentRecords[index].status != RecordStatus.DEPRECATED);
        agentRecords[index].status = RecordStatus.DEPRECATED;
        emit AgentDeprecated(name);
    }

    function updateAgent(bytes32 name, address agent) public {
        uint index = agentIndex[name];
        require(index != 0);
        address owner = tx.origin;
        require(agentRecords[index].owner == owner);
        require(Agent(agent).owner() == owner);
        agentRecords[index].agent = agent;
        emit AgentUpdated(name, agent);
    }

    function listAgents() public view returns (bytes32[], address[]) {
        bytes32[] memory names = new bytes32[](agentRecords.length - 1);
        address[] memory agents = new address[](agentRecords.length - 1);
        uint j = 0;
        for (uint i = 1; i < agentRecords.length; i++) {
            if (agentRecords[i].status == RecordStatus.ACTIVE) {
                names[j] = agentRecords[i].name;
                agents[j] = agentRecords[i].agent;
                j++;
            }
        }
        return (names, agents);
    }
}
