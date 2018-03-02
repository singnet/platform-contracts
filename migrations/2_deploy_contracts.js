const fs = require('fs')

const Job = artifacts.require('market/Job.sol')
/* const AgentFactory = artifacts.require('agent/AgentFactory.sol')
const AgentRegistry = artifacts.require('registries/AgentRegistry.sol')
const MarketJobFactory = artifacts.require('market/MarketJobFactory.sol')
const SingularityNetToken = artifacts.require('tokens/SingularityNetToken.sol')
const TokenVestingFactory = artifacts.require('tokens/TokenVestingFactory.sol') */

module.exports = function(deployer, network, accounts) {
  deployer.deploy([
    Job
  ]).then(() => {
    const fileName = "addresses.json"
    const content = {
      //AgentFactory: AgentFactory.address,
      Job: Job.address,
      //AgentRegistry: AgentRegistry.address,
      //MarketJobFactory: MarketJobFactory.address,
      //SingularityNetToken: SingularityNetToken.address,
      //TokenVestingFactory: TokenVestingFactory.address
    }

    fs.writeFile(fileName, JSON.stringify(content), 'utf-8', (err) => {
      if (err) { throw err }
      console.log("Contracts addresses saved in ./" + fileName)
    })
  })
};
