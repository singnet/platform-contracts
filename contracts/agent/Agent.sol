pragma solidity ^0.4.18;

import "../market/MarketJob.sol";
import "../market/SimpleJob.sol";

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Agent is Ownable {

    bytes[] public packets;
    address token;
    address last_job;

    event job_created(address job_address);

    function Agent(address _token) public {
        token = _token;
    }

    function deposit() external payable {}
    function () external payable {}

    function sendPacket(address target, bytes packet) external onlyOwner {
        Agent(target).appendPacket(packet);
    }

    // @todo only people who can
    function appendPacket(bytes packet) external {
        packets.push(packet);
    }

    function getPacket(uint id) external constant returns (bytes) {
        return packets[id];
    }

    function lastJob() external view returns (address) {
        return last_job;
    }

    function create_simple_job(
        address _payer,
        uint256 _amount,
        uint256 _job_descriptor_hash ) public returns (SimpleJob)
    {
        SimpleJob simple_job = new SimpleJob(
            token,
            _payer,
            _amount,
            _job_descriptor_hash
        );

        job_created(simple_job);
        last_job = simple_job;

        return simple_job;
    }

    function setJobCompleted(address job, uint256 _job_result_hash) external {
        last_job = 0x0;
        MarketJobInterface(job).setJobCompleted(_job_result_hash);
    }
}
