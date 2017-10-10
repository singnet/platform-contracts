pragma solidity ^0.4.11;

import "./ownership/ownable.sol";

contract MarketJob is ownable {

    address public payer;
    bytes public lastPacket;
    bytes public firstPacket;
    bool public jobCompleted;

    mapping (address => uint) public amounts;

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
        uint[] _amounts,
        address _payer,
        bytes _firstPacket,
        bytes _lastPacket
    ) payable {
        require(_agents.length == _amounts.length);
        payer = _payer;
        lastPacket = _lastPacket;
        firstPacket = _firstPacket;

        for (uint i = 0; i < _amounts.length; i++) {
            amounts[_agents[i]] = _amounts[i];
        }
    }

    function withdraw() external jobDone {
        require(amounts[msg.sender] > 0);
        uint256 amount = amounts[msg.sender];

        amounts[msg.sender] = 0;
        msg.sender.transfer(amount);
    }

    function setJobCompleted() external jobPending {
        jobCompleted = true;
    }
}