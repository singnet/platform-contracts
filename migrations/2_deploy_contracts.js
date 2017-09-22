var Agent = artifacts.require('agent/Agent.sol')
var AgentFactory = artifacts.require('agent/AgentFactory.sol')
var AgentRegistry = artifacts.require('registries/AgentRegistry.sol')
var FixedSupplyToken = artifacts.require('tokens/FixedSupplyToken.sol')
var Escrow = artifacts.require('Escrow.sol')
var ownable = artifacts.require('ownership/ownable.sol')
var OrganizationFactory = artifacts.require('organization/OrganizationFactory.sol')
var Organization = artifacts.require('organization/Organization.sol')

module.exports = function(deployer) {
  deployer.deploy([
    Agent,
    AgentFactory,
    AgentRegistry,
    FixedSupplyToken,
    Escrow,
    ownable,
    Organization,
    OrganizationFactory
  ])
};
