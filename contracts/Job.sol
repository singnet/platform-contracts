pragma solidity ^0.4.21;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./Agent.sol";

contract Job {
    enum JobState {
        PENDING,
        FUNDED,
        COMPLETED
    }

    ERC20 public token;
    uint public jobPrice;
    address public consumer;
    Agent public agent;
    JobState public state;
    
    event JobFunded();
    event JobCompleted();

    function Job(address _token, uint _jobPrice) public {
        token = ERC20(_token);
        jobPrice = _jobPrice;
        consumer = tx.origin;
        agent = Agent(msg.sender);
        state = JobState.PENDING;
    }

    function fundJob() public {
        require(state == JobState.PENDING);
        require(token.transferFrom(consumer, this, jobPrice));
        agent.fundJob();
        state = JobState.FUNDED;
        emit JobFunded();
    }

    function completeJob(uint8 v, bytes32 r, bytes32 s) public returns (bool) {
        require(state == JobState.FUNDED);
        require(ecrecover(keccak256("\x19Ethereum Signed Message:\n32", keccak256(this)), v, r, s) == consumer);
        require(token.approve(address(agent), jobPrice));
        state = JobState.COMPLETED;
        emit JobCompleted();
        return true;
    }
}
