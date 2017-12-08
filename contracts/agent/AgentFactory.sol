pragma solidity ^0.4.18;

import "./Agent.sol";

contract AgentFactory {

    event agent_created(address agent_address);

    function create() public returns (address new_agent) {
        new_agent = new Agent();
        agent_created(new_agent);
        return new_agent;
    }
}
