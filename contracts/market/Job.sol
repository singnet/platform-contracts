pragma solidity ^0.4.18;

import "./JobValidator.sol";
/**
 * @title The wrapped Job contract 
 */
contract Job is JobValidator {

    /**
     * @dev Determines if job is completed
     */
    bool public isCompleted = false; 

    /**
     * @dev Who can set the result
     */
    address public provider;
    
    /**
     * @dev Price in AGI for the exection of the job
     * (10**8 cogs === 1 AGI)
     */
    uint256 public price;

    /**
     * @dev Started event
     */
    event Started(address indexed payer, address indexed payee, bytes32 descriptor, address job);

    /**
     * @dev Set result of this Job
     * @param _result Result data hash
     */
    function setResult(bytes32 _result) public returns (bool) {
        require(msg.sender == provider);
        require(descriptor.length > 0);

        end = now;
 
        Result(_result);
        result = _result;

        Completed();
        isCompleted = true;

        return true;
    }

    /**
     * @dev The payee can change the provider address
     * @param _provider New provider
     */
     function setProvider(address _provider) public returns(bool) {
         require(msg.sender == payee);
         provider = _provider;
         return true;
     }



}