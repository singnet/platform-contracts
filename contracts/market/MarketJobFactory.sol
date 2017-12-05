pragma solidity ^0.4.18;

import "./MarketJob.sol";

contract MarketJobFactory {

    event Created(address creator, address contractAddress);

    function create(
        address[] agents, 
        uint256[] amounts, 
        uint256[] services, 
        address token, 
        address payer, 
        bytes firstPacket ) public returns (MarketJob) 
    {
        MarketJob marketJob = new MarketJob(
            agents, 
            amounts, 
            services, 
            token, 
            payer, 
            firstPacket
        );

        Created(msg.sender, marketJob);

        return marketJob;
    }

}
