pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC20.sol";
import "./Agent.sol";

contract Job {
    enum JobStatus {
        PENDING,
        FUNDED,
        COMPLETED
    }

    ERC20 public token;
    uint public jobPrice;
    address public consumer;
    Agent public agent;
    JobStatus public status;
    
    event JobFunded();
    event JobCompleted();

    function Job(address _token, uint _jobPrice) public {
        token = ERC20(_token);
        jobPrice = _jobPrice;
        consumer = tx.origin;
        agent = Agent(msg.sender);
        status = JobStatus.PENDING;
    }

    function fundJob() public {
        require(status == JobStatus.PENDING);
        require(token.transferFrom(consumer, this, jobPrice));
        agent.fundJob();
        status = JobStatus.FUNDED;
        emit JobFunded();
    }

    function completeJob(uint8 v, bytes32 r, bytes32 s) public returns (bool) {
        require(status == JobStatus.FUNDED);
        require(ecrecover(keccak256("\x19Ethereum Signed Message:\n32", keccak256(this)), v, r, s) == consumer);
        require(token.approve(address(agent), jobPrice));
        status = JobStatus.COMPLETED;
        emit JobCompleted();
        return true;
    }
}
