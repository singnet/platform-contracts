pragma solidity ^0.4.11;

import "./OrganizationInterface.sol";

contract Organization is OrganizationInterface {

  struct Invoice {
    address agent;
    uint amount;
  }
  mapping (uint => address) agentOnService;
  Invoice[] invoices;

  function join(uint service, address agent) external {
    agentOnService[service] = agent;
  }

  function quit(uint service) external {
    delete agentOnService[service];
  }

  function addInvoice(uint service, uint amount) external {
    invoices.push(Invoice(agentOnService[service], amount));
  }

  // function payAgents() external {
  //   //TODO pay agents
  //   delete invoices;
  //   //delete agentOnService;
  // }

}