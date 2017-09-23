const Agent = artifacts.require('agent/Agent.sol')
const AgentFactory = artifacts.require('agent/AgentFactory.sol')
const AgentRegistry = artifacts.require('registries/AgentRegistry.sol')
const SingularityNetToken = artifacts.require('tokens/SingularityNetToken.sol')
const FixedSupplyToken = artifacts.require('tokens/FixedSupplyToken.sol')
const Escrow = artifacts.require('Escrow.sol')
const ownable = artifacts.require('ownership/ownable.sol')
const OrganizationFactory = artifacts.require('organization/OrganizationFactory.sol')
const Organization = artifacts.require('organization/Organization.sol')

module.exports = function(deployer) {
  deployer.deploy([
    Agent,
    Escrow,
    ownable,
    AgentFactory,
    Organization,
    AgentRegistry,
    FixedSupplyToken,
    OrganizationFactory,
    SingularityNetToken
  ])
};
