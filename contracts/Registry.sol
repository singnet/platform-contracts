pragma solidity ^0.4.21;

import "./Agent.sol";

contract Registry {
    enum RecordState {
        ALIVE,
        DEAD
    }

    struct AgentRecord {
        address agent;
        bytes32 name;
        RecordState state;
    }

    AgentRecord[] public agentRecords;
    mapping(bytes32 => uint) public agentIndex;

    event RecordCreated(bytes32 name, address agent);
    event RecordUpdated(bytes32 name, address agent);
    event RecordDeprecated(bytes32 name);

    function Registry() public {
        // The 0th index of this list cannot be used because of the fact that agentIndex[name] == 0 when
        // name is *not* valid
        agentRecords.push(AgentRecord(address(0), "", RecordState.DEAD));
    }

    function createRecord(bytes32 name, address agent) public {
        require(agentIndex[name] == 0);
        require(Agent(agent).owner() == tx.origin);
        agentIndex[name] = agentRecords.push(AgentRecord(agent, name, RecordState.ALIVE)) - 1;
        emit RecordCreated(name, agent);
    }

    function updateRecord(bytes32 name, address agent) public {
        uint index = agentIndex[name];
        require(index != 0);
        address owner = tx.origin;
        require(agentRecords[index].state == RecordState.ALIVE);
        require(Agent(agentRecords[index].agent).owner() == owner);
        require(Agent(agent).owner() == owner);
        agentRecords[index].agent = agent;
        emit RecordUpdated(name, agent);
    }

    function deprecateRecord(bytes32 name) public {
        uint index = agentIndex[name];
        require(index != 0);
        require(agentRecords[index].state == RecordState.ALIVE);
        require(Agent(agentRecords[index].agent).owner() == tx.origin);
        agentRecords[index].state = RecordState.DEAD;
        emit RecordDeprecated(name);
    }

    function listRecords() public view returns (bytes32[], address[]) {
        bytes32[] memory names = new bytes32[](agentRecords.length - 1);
        address[] memory agents = new address[](agentRecords.length - 1);
        uint j = 0;
        for (uint i = 1; i < agentRecords.length; i++) {
            if (agentRecords[i].state == RecordState.ALIVE) {
                names[j] = agentRecords[i].name;
                agents[j] = agentRecords[i].agent;
                j++;
            }
        }
        return (names, agents);
    }
}
