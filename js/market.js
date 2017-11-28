//web3js
const Web3 = require('web3')
const web3 = new Web3("http://localhost:8545")
//contracts ABI 
const marketFactory = require("../build/contracts/MarketJobFactory.json")
const token = require("../build/contracts/SingularityNetToken.json")
//constants 
const MARKET_FACTORY_ADDRESS = "0xB86d5Ec230F706104eA3CDA6664AA02548591124"
const TOKEN_ADDRESS = "0xbf625fD0aE8C827D9A9ecbA19fe959723CE052EC"
const firstAgent = "0x951BE8FAE44CD16a1152DA1CcC8c414f7aEC7bd6"
const PAYER = "0xabdd6525BC4012B07a3A3758070C676fAd70869B"

const tokenContract = new web3.eth.Contract(token.abi,TOKEN_ADDRESS)
const factoryContract = new web3.eth.Contract(marketFactory.abi,MARKET_FACTORY_ADDRESS)
//payload dev 
const GAS = 200000, GAS_PRICE = 10000000000000,
      PAYLOAD = { from:PAYER, gas: GAS, gasPrice: GAS_PRICE}


async function getSymbol() {
  return await new Promise((resolve,reject) => {
    tokenContract.methods.SYMBOL.call()
      .then(resolve)
      .catch(reject)
  })
}
//appendPacket
async function createMarketJob() {
  return await new Promise((resolve,reject) => {
    factoryContract.methods.create(
      [firstAgent], //agents
      [300], //amounts
      [101], //ids services 
      TOKEN_ADDRESS, //token addrss
      PAYER, //payer
      "0x01"
    ).send(PAYLOAD)
      .then(result => {
        resolve(result)
      })
      .catch( reason => {
        reject(reason)
      })
  })
}


async function main() {
  try {
    //console.log(Object.keys(tokenContract.methods))
    console.log(await tokenContract.methods.SYMBOL().call())
    const result = await createMarketJob()
    console.log(result.events)
    //const marketJobContract = new web3.eth.Contract(marketJob.abi)
  } catch (reason) {
    console.log(reason)
  }
}

main()

