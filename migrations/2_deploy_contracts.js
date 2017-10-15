const fs = require('fs')

const Escrow = artifacts.require('Escrow.sol')
const Agent = artifacts.require('agent/Agent.sol')
const MarketJob = artifacts.require('MarketJob.sol')
const ownable = artifacts.require('ownership/ownable.sol')
const AgentFactory = artifacts.require('agent/AgentFactory.sol')
const AgentRegistry = artifacts.require('registries/AgentRegistry.sol')
const SingularityNetToken = artifacts.require('tokens/SingularityNetToken.sol')

module.exports = function(deployer, network, accounts) {
  deployer.deploy([
    Agent,
    Escrow,
    ownable,
    MarketJob,
    AgentFactory,
    AgentRegistry,
    SingularityNetToken
  ]).then(() => {
    const fileName = "addresses.json"
    const content = {
      Agent: Agent.address,
      Escrow: Escrow.address,
      ownable: ownable.address,
      MarketJob: MarketJob.address,
      AgentFactory: AgentFactory.address,
      AgentRegistry: AgentRegistry.address,
      SingularityNetToken: SingularityNetToken.address
    }

    fs.writeFile(fileName, JSON.stringify(content), 'utf-8', (err) => {
      if (err) { throw err }
      console.log("Contracts' addresses saved in ./" + fileName)
    })
  })
};
