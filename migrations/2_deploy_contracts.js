const fs = require('fs')

const Agent = artifacts.require('agent/Agent.sol')
const AgentFactory = artifacts.require('agent/AgentFactory.sol')
const MarketJob = artifacts.require('MarketJob.sol')
const AgentRegistry = artifacts.require('registries/AgentRegistry.sol')
const SingularityNetToken = artifacts.require('tokens/SingularityNetToken.sol')
const Escrow = artifacts.require('Escrow.sol')
const ownable = artifacts.require('ownership/ownable.sol')
const AgiCrowdsale = artifacts.require("AgiCrowdsale.sol")

module.exports = function(deployer, network, accounts) {
  const startTime =  1 // one second in the future
  const endTime = startTime + (86400 * 20) // 20 days
  const rate = 10000000
  const wallet = accounts[0]
  const goal =  8 * 1000
  const cap =  10 * 1000
  console.log(startTime,endTime,rate,cap,goal,wallet)


  deployer.deploy([
    Agent,
    Escrow,
    ownable,
    MarketJob,
    AgentFactory,
    AgentRegistry,
    SingularityNetToken,
    // [AgiCrowdsale, startTime, endTime, rate, goal, cap, wallet]    
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
