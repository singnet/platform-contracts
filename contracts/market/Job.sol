pragma solidity ^0.4.18;

contract Job {
    uint256 public status = 0;
    bytes32 public jobDescriptor;
    bytes32 public jobResult;

    uint256 public start;
    uint256 public end;

    address public payer;
    address public payee;

    event JobStarted(address indexed payer, address indexed payee, bytes32 jobDescriptor, address jobAddress);
    event JobCompleted(bytes32 jobResult, address jobAddress);

    function setJobStarted(address _payer, address _payee, bytes32 _jobDescriptor) public {
        require(status < 1);
        payer = _payer;
        payee = _payee;
        jobDescriptor = _jobDescriptor;
        status = 1;
        start = now;

        JobStarted(payer, payee, jobDescriptor, address(this));
    }

    function setJobCompleted(bytes32 _jobResult) public {
        require(msg.sender == payee);
        require(status < 2);        
        status = 2;
        jobResult = _jobResult;
        end = now;

        JobCompleted(jobResult, address(this));

    }

}