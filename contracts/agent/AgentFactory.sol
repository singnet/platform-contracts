pragma solidity ^0.4.18;

import "./Agent.sol";

contract AgentFactory {

    address token;

    event agent_created(address agent_address);

    function setToken(address _token) public
    {
        token = _token;
    }

    function getToken() external view returns(address)
    {
        return token;
    }

    function create() public returns (address new_agent) {
        new_agent = new Agent(token);
        agent_created(new_agent);
        return new_agent;
    }
}
