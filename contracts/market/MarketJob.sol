pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../tokens/SingularityNetToken.sol";
import "./MarketJobInterface.sol";


contract MarketJob is MarketJobInterface {
    using SafeMath for uint256;

    SingularityNetToken public token;
    address public masterAgent;
    bytes public jobDescriptorHash;
    bool public jobCompleted;
    bool public jobAccepted;
    bytes public jobResult;
    address public payer;

    event Deposited(address payer, uint256 amount);
    event Withdrew(address payee, uint256 amount);
    event JobCompleted();
    event JobAccepted();


    struct Job {
        uint256 amount;
        uint256 idService;
    }

    mapping (address => Job) public amounts;

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

    modifier onlyMasterAgent {
        require(msg.sender == masterAgent);
        _;
    }

    function MarketJob(
        address[] _agents,
        uint256[] _amounts,
        uint256[] _services,
        address _token,
        address _payer,
        bytes _jobDescriptorHash
    ) public
    {
        require(_agents.length == _amounts.length);
        require(_amounts.length == _services.length);
        masterAgent = msg.sender;
        payer = _payer;
        jobDescriptorHash = _jobDescriptorHash;
        jobCompleted = false;
        token = SingularityNetToken(_token);

        for (uint256 i = 0; i < _amounts.length; i++) {
            amounts[_agents[i]] = Job(_amounts[i],_services[i]);
        }
    }

    function deposit(uint256 amount) onlyPayer jobPending public {
        require(token.transferFrom(msg.sender, address(this), amount));
        Deposited(msg.sender,amount);
    }

    function setJobCompleted(bytes _jobResult) public onlyMasterAgent jobPending {
        jobCompleted = true;
        jobResult = _jobResult;
        JobCompleted();
    }

    function setJobAccepted() public onlyPayer jobDone {
        jobAccepted = true;
        JobAccepted();
    }

    function withdraw() public jobDone jobApproved {
        address agent = msg.sender;
        uint256 amount = amounts[agent].amount;
        require(amount > 0);

        amounts[agent].amount = 0;
        require(token.transfer(agent,amount));
        Withdrew(agent,amount);
    }
}

contract SimpleJob is MarketJobInterface {
    using SafeMath for uint256;

    SingularityNetToken public token;
    address public masterAgent;
    bytes public jobDescriptorHash;
    bool public jobCompleted;
    bool public jobAccepted;
    bytes public jobResult;
    address public payer;

    uint256 public amount;

    event Deposited(address payer, uint256 _amount);
    event Withdrew(address payee, uint256 _amount);
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

    modifier onlyMasterAgent {
        require(msg.sender == masterAgent);
        _;
    }

    function SimpleJob(
        uint256 _amount,
        address _token,
        address _payer,
        bytes _jobDescriptorHash
    ) public
    {
        masterAgent = msg.sender;
        payer = _payer;
        jobDescriptorHash = _jobDescriptorHash;
        jobCompleted = false;
        token = SingularityNetToken(_token);
        amount = _amount;
    }

    function deposit(uint256 _amount) public onlyPayer jobPending {
        require(token.transferFrom(msg.sender, address(this), _amount));
        Deposited(msg.sender, _amount);
    }

    function setJobCompleted(bytes _jobResult) public onlyMasterAgent jobPending {
        jobCompleted = true;
        jobResult = _jobResult;
        JobCompleted();
    }

    function setJobAccepted() public onlyPayer jobDone {
        jobAccepted = true;
        JobAccepted();
    }

    function withdraw() public jobDone jobApproved {
        address agent = msg.sender;
        require(amount > 0);

        amount = 0;
        require(token.transfer(agent, amount));
        Withdrew(agent, amount);
    }
}
