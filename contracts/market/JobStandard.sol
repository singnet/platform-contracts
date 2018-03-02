pragma solidity ^0.4.18;

/**
 * @title The Job Interface contract 
 */

contract JobStandard {
    /** 
     * @dev Starting hash of the job
     */
    bytes32 public descriptor;

    /** 
     * @dev Result hash of the job
     */
    bytes32 public result;

    /** 
     * @dev Start time timestamp 
     */
    uint256 public start;

    /** 
     * @dev End time timestamp 
     */
    uint256 public end;

    /**
     * @dev An agent who pays the job.
     */
    address public payer;

    /**
     * @dev An agent to whom the job is paid.
     */
    address public payee;

    /**
     * @dev Broadcast new hash as job result.
     */
    event Result(bytes32 result); 
}