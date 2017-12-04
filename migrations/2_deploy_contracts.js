const fs = require('fs')

const MarketJobFactory = artifacts.require('market/MarketJobFactory.sol')
const AgentFactory = artifacts.require('agent/AgentFactory.sol')
const AgentRegistry = artifacts.require('registries/AgentRegistry.sol')
const SingularityNetToken = artifacts.require('tokens/SingularityNetToken.sol')

module.exports = function(deployer, network, accounts) {
  deployer.deploy([
    AgentFactory,
    AgentRegistry,
    MarketJobFactory,
    SingularityNetToken
  ]).then(() => {
    const fileName = "addresses.json"
    const content = {
      AgentFactory: AgentFactory.address,
      AgentRegistry: AgentRegistry.address,
      MarketJobFactory: MarketJobFactory.address,
      SingularityNetToken: SingularityNetToken.address
    }

    fs.writeFile(fileName, JSON.stringify(content), 'utf-8', (err) => {
      if (err) { throw err }
      console.log("Contracts addresses saved in ./" + fileName)
    })
  })
};
