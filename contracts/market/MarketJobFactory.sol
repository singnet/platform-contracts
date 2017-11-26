pragma solidity ^0.4.18;

import "./MarketJob.sol";

contract MarketJobFactory {

    function create(
        address[] agents,
        uint256[] amounts,
        uint256[] services,
        address token,
        address payer,
        bytes firstPacket) public returns (MarketJob) 
    {
        return new MarketJob(agents, amounts, services, token, payer, firstPacket);
    }

}
