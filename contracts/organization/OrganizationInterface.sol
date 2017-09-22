pragma solidity ^0.4.11;

contract OrganizationInterface {
    // join/exit organization
    // handle money
    // invoke invoice when agent end job
    function join(uint service, address agent) external;
    function quit(uint service) external;
    function addInvoice(uint service, uint amount) external;
    // function payAgents() external;
}