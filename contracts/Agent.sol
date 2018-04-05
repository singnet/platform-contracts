pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC20.sol";
import "./Job.sol";

contract Agent {
    address public owner;
    ERC20 public token;
    mapping(address => bool) public createdJobs;
    uint public currentPrice;

    event JobCreated(address job, address consumer, uint jobPrice);
    event JobFunded(address job);
    event JobCompleted(address job);

    function Agent(address _token, uint _currentPrice) public {
        owner = tx.origin;
        token = ERC20(_token);
        currentPrice = _currentPrice;
    }

    function setPrice(uint _currentPrice) public {
        require(tx.origin == owner);
        currentPrice = _currentPrice;
    }

    function createJob() public returns (address, uint) {
        address job = new Job(address(token), currentPrice);
        createdJobs[job] = true;
        emit JobCreated(job, Job(job).consumer(), currentPrice);
        return (job, currentPrice);
    }

    function fundJob() public {
        address job = msg.sender;
        require(createdJobs[job]);
        require(Job(job).status() == Job.JobStatus.PENDING);
        emit JobFunded(job);
    }

    function validateJobInvocation(address job, uint8 v, bytes32 r, bytes32 s) public view returns (bool) {
        if (createdJobs[job] && Job(job).status() == Job.JobStatus.FUNDED && ecrecover(keccak256("\x19Ethereum Signed Message:\n32", keccak256(job)), v, r, s) == Job(job).consumer()) {
            return true;
        }
        return false;
    }

    function completeJob(address job, uint8 v, bytes32 r, bytes32 s) public {
        require(createdJobs[job]);
        require(Job(job).completeJob(v, r, s));
        require(token.transferFrom(job, owner, Job(job).jobPrice()));
        emit JobCompleted(job);
    }
}
