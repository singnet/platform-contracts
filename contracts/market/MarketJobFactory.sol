pragma solidity ^0.4.15;

import './MarketJob.sol';


contract MarketJobFactory {

    function create(
        address[] agents,
        uint256[] amounts,
        uint256[] services,
        address payer,
        bytes firstPacket) public returns (MarketJob) 
    {
        return new MarketJob(agents,amounts,services,payer,firstPacket);
    }

}
