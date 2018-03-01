pragma solidity ^0.4.13;

contract JobInterface {
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

        end = now;
 
        Result(_result);
        result = _result;

        Completed();

        return true;
    }



}

