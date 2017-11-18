pragma solidity ^0.4.15;


contract MarketJobInterface {

    event JobCompleted();
    event Withdraw(address payee, uint256 amount);

    function withdraw() external;

}
