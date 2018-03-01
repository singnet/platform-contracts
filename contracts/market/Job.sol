pragma solidity ^0.4.18;

import './JobValidator.sol';
/**
 * @title The wrapped Job contract 
 */
contract Job is JobValidator {

     /**
    * @dev Kovan AGI token.
    * https://kovan.etherscan.io/token/0x3b226ff6aad7851d3263e53cb7688d13a07f6e81#readContract
    * ERC20Basic public constant AGI = ERC20Basic(0x3b226ff6aad7851d3263e53cb7688d13a07f6e81);
    */  

    /**
     * @dev Cost in AGI for the exection of the job
     * (10**8 cogs === 1 AGI)
     */
    uint256 public cost;

    /**
     * @dev Started event
     */
    event Started(address indexed payer, address indexed payee, bytes32 descriptor, address job);

     /**
      * @dev Job constructor.
      * @param _payer An agent who pays the job.
      * @param _payee An agent to whom the job is paid.
      * @param _cost Cost in AGI
      */
    function Job(address _payer, address _payee, bytes32 _descriptor, uint256 _cost, uint256 _reward) public {

        payer = _payer;
        payee = _payee;
        descriptor = _descriptor;
        cost = _cost;
        reward = _reward;

        start = now;

        Started(payer, payee, descriptor, address(this));
    }

    /**
     * @dev Set result of this Job
     * @param _result Result data hash
     */
    function setResult(bytes32 _result) public returns (bool) {
        require(msg.sender == payee);
        require(descriptor.length > 0);
        require(result.length == 0);

        end = now;
 
        Result(_result);
        result = _result;

        Completed();

        return true;
    }



}