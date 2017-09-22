pragma solidity ^0.4.11;

import './Organization.sol';

contract OrganizationFactory {

  function create() public returns (Organization) {
    return new Organization();
  }

}