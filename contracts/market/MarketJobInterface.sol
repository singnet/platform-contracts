pragma solidity ^0.4.15;


contract MarketJobInterface {

    event JobCompleted();
    event Withdraw(address payee, uint256 amount);

    function deposit() public payable;
    function withdraw(address agent) public;
    function setJobCompleted(bytes lastPacket) public;

}
