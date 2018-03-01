pragma solidity ^0.4.18;

import "./JobInterface.sol";

/**
 * @title The Job Validator contract 
 */

contract JobValidator is JobInterface {

    /**
     * @dev Reward for validator in AGI.
     */
    address public validator; 

    /**
     * @dev Validation status
     * 0 == pending && 1 == accepted && 2 == rejected 
     */
    address public status = 0; 
    
    /**
     * @dev Reward for validator in AGI.
     */
    uint256 public reward; 

    /**
     * @dev Completed event to notice the validators pool
     */
    event Completed();

    /**
     * @dev Approved event to notice the parties
     */
    event Accepted();

    /**
     * @dev Rejected event to notice the parties
     */
    event Rejected();


    /**
     * @dev Confirm job result
     */
    function accept() public {
        validator = msg.sender;
        status = 1;

        Accepted();
    }

    /**
     * @dev Reject job result
     */
    function reject() public {
        validator = msg.sender;
        status = 2;

        Rejected();
    }

}