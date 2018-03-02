pragma solidity ^0.4.18;

import "./JobStandard.sol";

/**
 * @title The Job Validator contract 
 */

contract JobValidator is JobStandard {

    /**
     * @dev Reward for validator in AGI.
     */
    address public validator; 

    /**
     * @dev rejection status
     */
    bool public isRejected = false; 
    
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
        Accepted();
    }

    /**
     * @dev Reject job result
     */
    function reject() public {
        require(msg.sender==validator);
        isRejected = true;
        Rejected();
    }

}