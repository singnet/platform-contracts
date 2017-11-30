// Import libraries we need.
const Web3 = require('web3')
const contract = require('truffle-contract')
// Import our contract artifacts and turn them into usable abstractions.
const Agent = require('../build/contracts/AgentFactory.json')
const agent = contract(Agent)

const account = "0x627306090abab3a6e1400e9345bc60c78a8bef57"

function create() {
  agent.setProvider(new Web3.providers.HttpProvider("http://localhost:9545"))

  agent.deployed().then(function (instance) {
    return instance.create({
      from: account,
      gas: 180000
    })
  }).then((tx) => {
    console.log(tx)
  }).then(console.log)
    .catch(function (e) {
      console.log(e)
    })
}

create()