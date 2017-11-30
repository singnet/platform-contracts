// Import libraries we need.
const Web3 = require('web3')
const contract = require('truffle-contract')
// Import our contract artifacts and turn them into usable abstractions.
const MarketJob = require('../build/contracts/MarketJob.json')
const marketJob = contract(MarketJob)


const account = "0x951BE8FAE44CD16a1152DA1CcC8c414f7aEC7bd6",
  PAYER = process.env.PAYER || account,
  AGENTS = process.env.AGENTS || [account],
  AMOUNTS = process.env.AMOUNTS || [new marketJob.web3.BigNumber(300)],
  SERVICES = process.env.SERVICES || [new marketJob.web3.BigNumber(101)],
  JOB_DESCRIPTOR = process.env.JOB_DESC || "0x0"

async function create() {
  marketJob.setProvider(new Web3.providers.HttpProvider("http://52.18.144.116:8545"))

  let tx 
  try {
    tx = await marketJob.new(
      AGENTS, // agents
      AMOUNTS, //amounts
      SERVICES, // services id
      "0xbf625fd0ae8c827d9a9ecba19fe959723ce052ec", //token address
      PAYER, // payer address
      JOB_DESCRIPTOR, // first bytes packet
      {
        from: account,
        gas: 1500000
      }
    )
    const payer = await tx.payer.call()
    console.log('New MarketJob started ')
    console.log('tx hash :' + tx.transactionHash)
    console.log('\n')

    console.log('=====================')
    console.log('PAYER   :' + payer)
    console.log('AGENT   :' + account)
    console.log('Amount,serviceId  : ' + await tx.amounts.call(account))
    console.log('\n')

    console.log('=====================')
    console.log('Job Descriptor')
    console.log(await tx.jobDescriptor.call())

  } catch (reason) {
    console.error(reason)
  }

  return tx
}

const allowAndDeposit = async (contract) => {
  

  //APPROVE 
  //await token.approve(escrow, amount, { from: acont })
  //const allowance = await token.allowance.call(account, escrow)
 
}


const main = async () => {
  const escrow = await create()
  await allowAndDeposit(escrow)
}   

main()
