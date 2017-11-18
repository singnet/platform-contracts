pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import "./MarketJobInterface.sol";


contract MarketJob is MarketJobInterface, Ownable {
    using SafeMath for uint256;


    address public payer;
    address public masterAgent;
    bytes public lastPacket;
    bytes public firstPacket;
    bool public jobCompleted;

    event JobCompleted();
    event Withdraw(address payee, uint256 amount);

    struct Job {
        uint256 amount;
        uint256 idService;
    }

    mapping (address => Job) public amounts;

    modifier jobDone {
        require(jobCompleted == true);
        _;
    }

    modifier jobPending {
        require(jobCompleted == false);
        _;
    }

    function MarketJob(
        address[] _agents,
        uint256[] _amounts,
        uint256[] _services,
        address _payer,
        bytes _firstPacket ) {
        require(_agents.length == _amounts.length);
        masterAgent = msg.sender;
        payer = _payer;
        firstPacket = _firstPacket;

        for (uint256 i = 0; i < _amounts.length; i++) {
            amounts[_agents[i]] = Job(_amounts[i],_services[i]);
        }
    }

    function deposit() payable {

    }

    function withdraw() external jobDone {
        require(amounts[msg.sender].amount > 0);
        uint256 amount = amounts[msg.sender].amount;

        amounts[msg.sender].amount = 0;
        Withdraw(msg.sender,amount);
        //msg.sender.transfer(amount);
    }

    function setJobCompleted(bytes _lastPacket) onlyOwner jobPending {
        jobCompleted = true;
        lastPacket = _lastPacket;
        JobCompleted();
    }
}
