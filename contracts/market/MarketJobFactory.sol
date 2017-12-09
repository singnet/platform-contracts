pragma solidity ^0.4.18;

import "./MarketJob.sol";

contract MarketJobFactory {

    address token;

    event Created(address creator, address contractAddress);

    function create(
        address[] _agents,
        uint256[] _amounts,
        uint256[] _services,
        SingularityNetToken _token,
        address _payer,
        bytes _jobDescriptorHash ) public returns (MarketJob)
    {
        MarketJob marketJob = new MarketJob(
            _agents,
            _amounts,
            _services,
            _token,
            _payer,
            _jobDescriptorHash
        );

        Created(msg.sender, marketJob);

        return marketJob;
    }

    function set_token(address _token) public
    {
        token = _token;
    }

    function create_simple(
        uint256 _amount,
        address _payer,
        bytes _jobDescriptorHash ) public returns (SimpleJob)
    {
        SimpleJob marketJob = new SimpleJob(
            _amount,
            token,
            _payer,
            _jobDescriptorHash
        );

        Created(msg.sender, marketJob);

        return marketJob;
    }

}
