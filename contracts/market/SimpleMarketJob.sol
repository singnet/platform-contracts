pragma solidity ^0.4.18;

import "../tokens/SingularityNetToken.sol";


contract SimpleMarketJob {

    SingularityNetToken public token;
    bytes32 public jobDescriptor;
    bytes32 public jobResult;
    bool public jobCompleted;
    bool public jobAccepted;
    address public payer;
    address public agent;

    event Deposited(address payer, uint256 amount);
    event Withdrew(address payee, uint256 amount);
    event JobCompleted();
    event JobAccepted();

    modifier jobDone {
        require(jobCompleted == true);
        _;
    }

    modifier jobApproved {
        require(jobAccepted == true);
        _;
    }

    modifier jobPending {
        require(jobCompleted == false);
        _;
    }

    modifier onlyPayer {
        require(msg.sender == payer);
        _;
    }

    modifier onlyAgent {
        require(msg.sender == agent);
        _;
    }

    function SimpleMarketJob( 
        address _agent,
        address _token,
        bytes32 _jobDescriptor
    ) {
        require(_token != 0x0);
        require(_agent != 0x0);

        agent = _agent;
        token = SingularityNetToken(_token);
        payer = msg.sender;
        jobCompleted = false;
        jobDescriptor = _jobDescriptor;

    }

    function deposit(uint256 amount) onlyPayer jobPending public {
        require(token.transferFrom(msg.sender, address(this), amount));
        Deposited(msg.sender,amount);
    }

    function setJobCompleted(bytes32 _jobResult) onlyAgent jobPending public {
        jobCompleted = true;
        jobResult = _jobResult;
        JobCompleted();
    }

    function setJobAccepted() onlyPayer jobDone public {
        jobAccepted = true;
        JobAccepted();
    }

    function withdraw() jobDone jobApproved public {
        uint256 _amount = token.balanceOf(address(this));
        require(_amount > 0);
        require(msg.sender == agent);
        require(token.transfer(agent, _amount));
        Withdrew(agent, _amount);
    }
}