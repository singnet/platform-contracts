const fs = require('fs')
const AgiCrowdsale = artifacts.require("foundation/AgiCrowdsale.sol")
const SingularityNetToken = artifacts.require("token/SingularityNetToken.sol")

function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
}

const duration = {
  seconds: function (val) { return val },
  minutes: function (val) { return val * this.seconds(60) },
  hours: function (val) { return val * this.minutes(60) },
  days: function (val) { return val * this.hours(24) },
  weeks: function (val) { return val * this.days(7) },
  years: function (val) { return val * this.days(365) }
}

module.exports = function(deployer, network, accounts) {
  const startTime = latestTime() + duration.minutes(5);
  const endTime = startTime + duration.days(20);
  const rate = new web3.BigNumber(1000);
  const wallet = web3.eth.accounts[0];
  const goal = new web3.BigNumber(3000 * Math.pow(10, 18));
  const cap = new web3.BigNumber(15000 * Math.pow(10, 18));

  deployer.deploy(
    AgiCrowdsale,
    SingularityNetToken.address,
    wallet,
    startTime,
    endTime,
    rate,
    goal,
    cap,
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
