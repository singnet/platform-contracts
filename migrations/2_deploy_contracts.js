const fs = require('fs')

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
  ]).then(() => {
    const fileName = "addresses.json"
    const content = {
      Agent: Agent.address,
      AgentFactory: AgentFactory.address,
      AgentRegistry: AgentRegistry.address,
      FixedSupplyToken: FixedSupplyToken.address,
      Escrow: Escrow.address,
      ownable: ownable.address,
      Organization: Organization.address,
      OrganizationFactory: OrganizationFactory.address,
      SingularityNetToken: SingularityNetToken.address
    }

    fs.writeFile(fileName, JSON.stringify(content), 'utf-8', (err) => {
      if (err) { throw err }
      console.log("Contracts' addresses saved in ./" + fileName)
    })
  })
};
