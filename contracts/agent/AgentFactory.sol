pragma solidity ^0.4.18;

import "./Agent.sol";

contract AgentFactory {

    function create() public returns (Agent) {
        return new Agent();
    }
}
