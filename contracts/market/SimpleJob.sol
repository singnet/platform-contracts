pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../tokens/SingularityNetToken.sol";
import "./MarketJobInterface.sol";

contract SimpleJob is MarketJobInterface {
    using SafeMath for uint256;

    SingularityNetToken token;
    address public      master_agent;
    uint256 public      job_descriptor_hash;
    bool public         job_completed;
    bool public         job_accepted;
    uint256 public      job_result_hash;
    address public      payer;

    uint256 public amount;

    event Deposited(address payer, uint256 _amount);
    event Withdrew(address payee, uint256 _amount);
    event JobCompleted();
    event JobAccepted();

    modifier jobDone {
        require(job_completed == true);
        _;
    }

    modifier jobApproved {
        require(job_accepted == true);
        _;
    }

    modifier jobPending {
        require(job_completed == false);
        _;
    }

    modifier onlyPayer {
        require(msg.sender == payer);
        _;
    }

    modifier onlyMasterAgent {
        require(msg.sender == master_agent);
        _;
    }

    function SimpleJob(
        address _token,
        address _payer,
        uint256 _amount,
        uint256 _job_descriptor_hash
    ) public
    {
        master_agent = msg.sender;
        payer = _payer;
        job_descriptor_hash = _job_descriptor_hash;
        job_completed = false;
        job_accepted = false;
        token = SingularityNetToken(_token);
        amount = _amount;
    }

    function deposit(uint256 _amount) external onlyPayer jobPending payable {
        require(token.transferSenderTokensTo(address(this), _amount));
        Deposited(msg.sender, _amount);
    }

    function getToken() external view returns(address) {
        return token;
    }

    function getThis() external view returns(address) {
        return address(this);
    }

    function getPayer() external view returns(address) {
        return payer;
    }

    function getSender() external view returns(address) {
        return msg.sender;
    }

    function isJobCompleted() external view returns(bool) {
        return job_completed;
    }

    function isJobPending() external view returns(bool) {
        return job_completed == false;
    }

    function amIPayer() external view returns(bool) {
        return msg.sender == payer;
    }

    function setJobCompleted(uint256 _job_result_hash) external onlyMasterAgent jobPending {
        job_completed = true;
        job_result_hash = _job_result_hash;
        JobCompleted();
    }

    function isJobAccepted() external view returns(bool) {
        return job_accepted;
    }

    function setJobAccepted() external jobDone {
        job_accepted = true;
        JobAccepted();
    }

    function jobDescriptorHash() external view returns(uint256) {
        return job_descriptor_hash;
    }

    function jobResultHash() external view returns(uint256) {
        return job_result_hash;
    }

    function withdraw() external jobDone jobApproved {
        address agent = msg.sender;
        require(amount > 0);

        amount = 0;
        require(token.transfer(agent, amount));
        Withdrew(agent, amount);
    }
}
