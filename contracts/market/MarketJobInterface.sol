pragma solidity ^0.4.18;


contract MarketJobInterface {

    event Deposited(address payer, uint256 amount);
    event Withdrew(address payee, uint256 amount);
    event JobCompleted();
    event JobAccepted();


    function withdraw() public;
    function setJobCompleted(bytes lastPacket) public;
    function setJobAccepted() public;
    function deposit(uint256 amount) public;

}
