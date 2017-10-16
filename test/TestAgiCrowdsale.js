const Crowdsale = artifacts.require('./helpers/AgiCrowdsaleMock.sol');
const AGIToken = artifacts.require('SingularityNetToken.sol');

const { latestTime, duration } = require('./helpers/latestTime');


contract('AgiCrowdsale', async function ([miner, owner, investor, wallet]) {
  let tokenOfferingDeployed;
  let tokenDeployed;
  beforeEach(async function () {
    tokenDeployed = await AGIToken.new();
    const startTime = latestTime() + duration.seconds(1);
    const endTime = startTime + duration.weeks(1);
    const rate = new web3.BigNumber(1000);
    const goal = new web3.BigNumber(3000 * Math.pow(10, 18));
    const cap = new web3.BigNumber(15000 * Math.pow(10, 18));
    console.log(startTime, endTime);
    tokenOfferingDeployed = await Crowdsale.new(tokenDeployed.address, startTime, endTime, rate, cap, goal, wallet);
    await tokenOfferingDeployed.setBlockTimestamp(startTime + duration.days(1));
  });
  it('should not be finalized', async function () {
    const isFinalized = await tokenOfferingDeployed.isFinalized();
    assert.isFalse(isFinalized, "isFinalized should be false");
  });

  it('goal should be 3000 ETH', async function () {
    const goal = await tokenOfferingDeployed.goal();
    assert.equal(goal.toString(10), '3000000000000000000000', "goal is incorrect");
  });

  it('cap should be 15000 ETH', async function () {
    const cap = await tokenOfferingDeployed.cap();
    assert.equal(cap.toString(10), '15000000000000000000000', "cap is incorrect");
  });

  describe('#whitelistAddresses', async function () {
    let investors;
    beforeEach(async function () {
      investors = [
        '0x2718C59E08Afa3F8b1EaA0fCA063c566BA4EC98B',
        '0x14ABEbe9064B73c63AEcd87942B0ED2Fef2F7B3B',
        '0x5850f06700E92eDe92cb148734b3625DCB6A14d4',
        '0xA38c9E212B46C58e05fCb678f0Ce62B5e1bc6c52',
        '0x7e2392A0DDE190457e1e8b2c7fd50d46ACb6ad4f',
        '0x0306D4C6ABC853bfDc711291032402CF8506422b',
        '0x1a91022B10DCbB60ED14584dC66B7faC081A9691'
      ];
    });
    it('should whitelist and blacklist', async function () {
      let firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses(investors, true);
      firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isTrue(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses(investors, false);
      firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);
    })

    it('allows to buy tokens', async function () {
      let firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses([investor], true);
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toString(10), '0');

      const value = web3.toWei(1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value, gas: '200000' });
      balance = await tokenOfferingDeployed.allocations(investor);
      assert.isTrue(balance.toNumber(10) > 0, 'balanceOf is 0 for investor who just bought tokens');
    })

  })
});
