const fs = require('fs')

const Agent = artifacts.require('agent/Agent.sol')
const AgentFactory = artifacts.require('agent/AgentFactory.sol')
const AgentRegistry = artifacts.require('registries/AgentRegistry.sol')
const MarketJob = artifacts.require('market/MarketJob.sol')
const MarketJobFactory = artifacts.require('market/MarketJobFactory.sol')
const SingularityNetToken = artifacts.require('tokens/SingularityNetToken.sol')
const TokenVestingFactory = artifacts.require('tokens/TokenVestingFactory.sol')

module.exports = function(deployer, network, accounts) {
  deployer.deploy([
    Agent,
    AgentFactory,
    AgentRegistry,
    MarketJob,
    MarketJobFactory,
    SingularityNetToken,
    TokenVestingFactory
  ]).then(() => {
    const fileName = "addresses.json"
    const content = {
      Agent: Agent.address,
      AgentFactory: AgentFactory.address,
      AgentRegistry: AgentRegistry.address,
      MarketJob: MarketJob.address,
      MarketJobFactory: MarketJobFactory.address,
      SingularityNetToken: SingularityNetToken.address,
      TokenVestingFactory: TokenVestingFactory.address
    }

    fs.writeFile(fileName, JSON.stringify(content), 'utf-8', (err) => {
      if (err) { throw err }
      console.log("Contracts addresses saved in ./" + fileName)
    })
  })
};
