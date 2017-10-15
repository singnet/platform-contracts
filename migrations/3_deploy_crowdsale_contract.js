const fs = require('fs')
const AgiCrowdsale = artifacts.require("AgiCrowdsale.sol")

module.exports = function(deployer, network, accounts) {
  const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1 // one second in the future
  const endTime = startTime + (86400 * 20) // 20 days
  const rate = new web3.BigNumber(1000)
  const wallet = accounts[0]
  const goal =  8 * 1000
  const cap =  10 * 1000

  console.log(startTime,endTime,cap,goal,wallet)

  deployer.deploy(
    AgiCrowdsale, startTime, endTime, rate, goal, cap, wallet  
  ).then(() => {
    const fileName = "addresses.json"

    fs.readFile(fileName, (err, data) => {
      if (!err) {
        let content = JSON.parse(data.toString())
        content["AgiCrowdsale"] = AgiCrowdsale.address

        fs.writeFile(fileName, JSON.stringify(content), 'utf-8', (err) => {
          if (err) { throw err }
          console.log("Added AgiCrowdsale to " + fileName)
        })
      }
    })
  })
};
