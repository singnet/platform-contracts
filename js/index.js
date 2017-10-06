/**
 *  
 * 
  AgentFactory: 0xc2950c3526254417351438babe5f2100cba90bf2
  Agent: 0x2bb2fdf0eb609046bbba217bca0765759a95600d
  AgentRegistry: 0x7988941a7d6037ef89b031af8606b88a1aa09e91
  FixedSupplyToken: 0xc180a3910eb79f257a849a0ecd5f1876223c2858
  Escrow: 0x278c4b8a81eebc94f2b2ebcac2ae33d4b889f5eb
  ownable: 0x4593de2c43ec702262480f6b0a57a200fa1296ed
 * 
 */
//web3js
const Web3 = require('web3')
const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545')
const OWNER = web3.eth.accounts[0]
 console.log(OWNER)
//const OWNER = '0xb9d2bdfe453640730919fbd8acc5083e991177ff'
//contracts ABI 
const agentFactory = require('../build/contracts/AgentFactory.json')
const agentRegistry = require('../build/contracts/AgentRegistry.json')
const agent = require('../build/contracts/Agent.json')
const escrow = require('../build/contracts/Escrow.json')
//constants 
const AGENT_FACTORY_ADDRESS = '0xd364ede69b6c1469fb19c145b3ad6f753f7f793a'
const AGENT_REGISTRY_CONTRACT = '0x7988941a7d6037ef89b031af8606b88a1aa09e91'
const AGENT_ADDRESS = '0x2bb2fdf0eb609046bbba217bca0765759a95600d'
const ESCROW_ADDRESS = '0x278c4b8a81eebc94f2b2ebcac2ae33d4b889f5eb'
//Using deployed contrat 
const agentFactoryContract = new web3.eth.Contract(agentFactory.abi,AGENT_FACTORY_ADDRESS)
const agentContract = new web3.eth.Contract(agent.abi,AGENT_ADDRESS)
const escrowContarct = new web3.eth.Contract(escrow.abi,ESCROW_ADDRESS)
const agentRegistryContract = new web3.eth.Contract(agentRegistry.abi, AGENT_REGISTRY_CONTRACT)
//payload dev 
const GAS = 1500000, GAS_PRICE = 30000000000000,
      PAYLOAD = { from:OWNER, gas: GAS, gasPrice: GAS_PRICE}

//Creates a new agent on the blockchain
async function joinNetwork() {
  return await new Promise((resolve,reject) =>{
    agentFactoryContract.methods.create().send({from:OWNER})
      .then((result) => {
        resolve(result)
      })
  }) 
}

//appendPacket
async function appendPacket(packet) {
  return await new Promise((resolve,reject) => {
    agentContract.methods.appendPacket(packet).send(PAYLOAD)
      .then(result => {
        resolve(result)
      })
      .catch( reason => {
        reject(reason)
      })
  })
}

//getPacket
async function getPacket(position) {
  return await new Promise((resolve,reject) => {
    agentContract.methods.getPacket(position).call({from:OWNER})
      .then(result => {
        resolve(result)
      })
      .catch( reason => {
        reject(reason)
      })
  })
}

//registers an agent's service offerings on the blockchain
async function advertiseService(service,agent) {
  return await new Promise((resolve,reject) => {
    agentRegistryContract.methods.addAgent(service,agent).send(PAYLOAD)
      .then(event => {
        resolve(event)
      })
  })
}

async function findServiceProviders(service) {
  return await new Promise((resolve,reject) => {
    agentRegistryContract.methods.getAgentsWithService(service).call(PAYLOAD)
      .then(agents => {
        resolve(agents)
      })
      .catch(reason => {
        reject(reason)
      })
  })
}

async function getAgentById(id) {
  return await new Promise((resolve,reject) => {
    agentRegistryContract.methods.getAgent(id).call(PAYLOAD)
      .then(resolve)
      .catch(reject)
  })
}

async function main() {
  const wordSenseDisambiguation = 0, textSummarization = 1
  
  const address = await joinNetwork()
  const address2 = await joinNetwork()
  console.log(address,address2)
  //console.log(address)
  //await advertiseService(textSummarization,address)
  
  //await appendPacket("0x0")
  //const r = await getPacket(0)

  //const providers = await findServiceProviders(textSummarization)
  //let target 
  //if (providers.length>0) target = await getAgentById(parseInt(providers[0]))
  //console.log(providers,target)

 
}


main()
