pragma solidity ^0.4.18;

import "./Job.sol";
import "zeppelin-solidity/contracts/token/ERC20.sol";

contract Escrow is Job {
    /**
     * @dev Kovan AGI token.
     * https://kovan.etherscan.io/token/0x3b226ff6aad7851d3263e53cb7688d13a07f6e81#readContract
     */  
    ERC20 public constant AGI = ERC20(0x3b226ff6aad7851d3263e53cb7688d13a07f6e81);
    
    /**
     * @dev Vault mapping
     */
    mapping(address => mapping(address => uint256)) public vault;
    
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
      * @param _cost Cost in AGI
      * @param _reward reward for validator
      */
    function Escrow(
        address _payer, 
        address _payee, 
        bytes32 _descriptor, 
        uint256 _cost, 
        uint256 _reward ) public
    {
        payer = _payer;
        payee = _payee;
        descriptor = _descriptor;
        cost = _cost;
        reward = _reward;

        provider = payee;
        start = now;

        Started(payer, payee, descriptor, address(this));
    }


    function deposit(uint256 amount) public {
        require(AGI.transferFrom(msg.sender, this, amount));

        Deposited(msg.sender,amount);
    }

    function withdraw() public {
        require(msg.sender == payee);
        require(status == 1);
        uint256 balance = AGI.balanceOf(this);
        require(AGI.transfer(msg.sender, balance));
        Withdrew(msg.sender, balance);
    }
}