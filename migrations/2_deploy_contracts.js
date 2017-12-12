const fs = require('fs')

const Agent = artifacts.require('agent/Agent.sol')
const AgentFactory = artifacts.require('agent/AgentFactory.sol')
const AgentRegistry = artifacts.require('registries/AgentRegistry.sol')
const SimpleJob = artifacts.require('market/SimpleJob.sol')
const MarketJob = artifacts.require('market/MarketJob.sol')
const SingularityNetToken = artifacts.require('tokens/SingularityNetToken.sol')
const TokenVestingFactory = artifacts.require('tokens/TokenVestingFactory.sol')

module.exports = function(deployer, network, accounts) {
  deleteDirectory = '../build';
  rmDir = function(dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
    if (files.length > 0)
      for (var i = 0; i < files.length; i++) {
        var filePath = dirPath + '/' + files[i];
        if (fs.statSync(filePath).isFile())
          fs.unlinkSync(filePath);
        else
          rmDir(filePath);
      }
    fs.rmdirSync(dirPath);
  };

  if (0) {
    console.log("Delesting directory " + deleteDirectory)
    rmDir(deleteDirectory);
    console.log("Delested directory " + deleteDirectory);
  }
  deployer.deploy([
    Agent,
    AgentFactory,
    AgentRegistry,
    SimpleJob,
    MarketJob,
    SingularityNetToken,
    TokenVestingFactory
  ]).then(() => {
    const fileName = "addresses.json"
    const content = {
      Agent: Agent.address,
      AgentFactory: AgentFactory.address,
      AgentRegistry: AgentRegistry.address,
      SimpleJob: SimpleJob.address,
      MarketJob: MarketJob.address,
      SingularityNetToken: SingularityNetToken.address,
      TokenVestingFactory: TokenVestingFactory.address
    }

    fs.writeFile(fileName, JSON.stringify(content), 'utf-8', (err) => {
      if (err) { throw err }
      console.log("Contracts addresses saved in ./" + fileName)
    })
  })
};
