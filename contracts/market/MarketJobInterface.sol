pragma solidity ^0.4.18;


contract MarketJobInterface {

    event Deposited(address payer, uint256 amount);
    event Withdrew(address payee, uint256 amount);
    event JobCompleted();
    event JobAccepted();


    function withdraw() external;
    function setJobCompleted(uint256 jobResultHash) external;
    function setJobAccepted() external;
    function deposit(uint256 amount) external payable;

}
