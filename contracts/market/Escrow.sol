pragma solidity ^0.4.18;

import "./Job.sol";
import "zeppelin-solidity/contracts/token/ERC20.sol";


contract Escrow is Job {
    /**
     * @dev Kovan token.
     * https://kovan.etherscan.io/token/0x3b226ff6aad7851d3263e53cb7688d13a07f6e81#readContract
     */  
    ERC20 public token;

    /**
     * @dev Fund  Timelock in milliseconds
     */
    uint256 public timelock;
    
    /**
     * @dev Deposited event
     */
    event Deposited(address payer, uint256 amount);

     /**
      * @dev Deposited event
      */
    event Withdrew(address payee, uint256 amount);

    /**
      * @dev Escrow constructor.
      * @param _payer An agent who pays the job.
      * @param _payee An agent to whom the job is paid.
      * @param _timelock how many seconds after end should be the window for rejections   
      * @param _validator who should check if rejected
      * @param _reward reward for validator
      */
    function Escrow(
        address _token,
        address _payer, 
        address _payee,
        uint256 _timelock,
        address _validator,
        uint256 _reward ) public
    {
        token = ERC20(_token);
        payer = _payer;
        payee = _payee;

        timelock = _timelock;
        //Reward for the validator in case of dispute
        validator = _validator;
        reward = _reward;

        //Who actually should deliver the job, capable of setResult and close the job
        //Beaware that who can withdraw money is still the payee, not the provider
        provider = payee;

    }

    /**
      * @dev Deposit function.
      * @param _amount Token amount to fill the price
      * @param _descriptor bytes hash that represent the input for the job      
      */
    function deposit(uint256 _amount, bytes32 _descriptor) public {
        require(msg.sender == payer);
        require(token.transferFrom(msg.sender, this, _amount));
        Deposited(msg.sender, _amount);
        
        descriptor = _descriptor;
        price = _amount;
        start = now;

        Started(payer, payee, descriptor, address(this));
    }

     /**
      * @dev withdraw all funds from escrow 
      */
    function withdraw() public {
        require(msg.sender == payee);
        require(timelockExpired());
        require(!isRejected); 

        uint256 balance = token.balanceOf(this);
        require (balance > 0);

        require(token.transfer(msg.sender, balance));
        Withdrew(msg.sender, balance);
    }

    function timelockExpired() internal constant returns(bool) {
        bool isExpired = (end + timelock) <= block.timestamp;
        return isCompleted && isExpired ;
    }

    
}