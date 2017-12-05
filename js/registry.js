// Import libraries we need.
const Web3 = require('web3')
const contract = require('truffle-contract')
// Import our contract artifacts and turn them into usable abstractions.
const Agent = require('../build/contracts/AgentRegistry.json')
const agent = contract(Agent)

const account = "0x627306090abab3a6e1400e9345bc60c78a8bef57",
  SERVICE = process.env.SERVICE || 0,
  UNIT = process.env.UNIT || 0,
  PRICE = process.env.PRICE || 100,
  AGENT = process.env.AGENT || account

function create() {
  agent.setProvider(new Web3.providers.HttpProvider("http://localhost:9545"))

  agent.deployed().then(function (instance) {
    return instance.addAgent(
      SERVICE,
      UNIT,
      PRICE,
      AGENT,
      { from: account, gas: 180000 }
    )
  }).then((tx) => {
    console.log(tx)
  }).then(console.log)
    .catch(function (e) {
      console.log(e)
    })
}

create()