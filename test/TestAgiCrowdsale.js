const Crowdsale = artifacts.require('./helpers/AgiCrowdsaleMock.sol');
const AGIToken = artifacts.require('SingularityNetToken.sol');

const { latestTime, duration } = require('./helpers/latestTime');


contract('AgiCrowdsale', async function ([miner, owner, contributor, wallet]) {
  let agiCrowdsale;
  let token;
  beforeEach(async function () {
    token = await AGIToken.new();
    const startTime = latestTime() + duration.seconds(1);
    const endTime = startTime + duration.weeks(1);
    const rate = new web3.BigNumber(1000);
    const goal = new web3.BigNumber(3000 * Math.pow(10, 18));
    const cap = new web3.BigNumber(15000 * Math.pow(10, 18));
    console.log(startTime, endTime);
    agiCrowdsale = await Crowdsale.new(token.address, startTime, endTime, rate, cap, goal, wallet);
    await agiCrowdsale.setBlockTimestamp(startTime + duration.days(1));
  });
  it('should not be finalized', async function () {
    const isFinalized = await agiCrowdsale.isFinalized();
    assert.isFalse(isFinalized, "isFinalized should be false");
  });

  it('goal should be 3000 ETH', async function () {
    const goal = await agiCrowdsale.goal();
    assert.equal(goal.toString(10), '3000000000000000000000', "goal is incorrect");
  });

  it('cap should be 15000 ETH', async function () {
    const cap = await agiCrowdsale.cap();
    assert.equal(cap.toString(10), '15000000000000000000000', "cap is incorrect");
  });

  describe('whitelist', async function () {
    let contributors;
    beforeEach(async function () {
      contributors = [
        '0x4f0d50e0456f88b417906a8cff84243ece7396f2',
        '0x6bb4b29e4b805c87e5387a3480b83c80291a2309',
        '0xc261bd3b83785040dbb5d57beb268615fc2f5e29',
        '0x9e70839c294f7dc48af8179d8a449e3536bc432f',
        '0x3622bb7863c39d62065ccd9a5cd3282d28529c8c',
        '0xa5285d08a7f0ea67a7ce9203664a9b6431e5fd15',
        '0x06cacb3745e2eadfb0612afffed3815becbac1e8',
        '0x07de5626afea063027c92aa52e71f2ecac2564da',
        '0x3894ffe9d19816dfa7c0e7336435eb581f9255b7',
        '0x48104a26f6ac28fb3823055378ddb65b772f10ec'
      ];
    });
    it('should add and remove from whitelist', async function () {
      let fisrtContributor = await agiCrowdsale.whitelist(contributors[0]);
      assert.isFalse(fisrtContributor);

      await agiCrowdsale.addWhitelist(contributors);
      fisrtContributor = await agiCrowdsale.whitelist(contributors[0]);
      assert.isTrue(fisrtContributor);

      await agiCrowdsale.removeWhitelist(contributors);
      fisrtContributor = await agiCrowdsale.whitelist(contributors[0]);
      assert.isFalse(fisrtContributor);
    })

    it('allows to purchase tokens', async function () {
      let firstContributor = await agiCrowdsale.whitelist(contributors[0]);
      assert.isFalse(firstContributor);

      await agiCrowdsale.addWhitelist([contributor]);
      let balance = await token.balanceOf(contributor);
      assert.equal(balance.toString(10), '0');

      const value = web3.toWei(1, 'ether');
      await agiCrowdsale.sendTransaction({ from: contributor, value, gas: '200000' });
      balance = await agiCrowdsale.allocations(contributor);
      assert.isTrue(balance.toNumber(10) > 0, 'balanceOf is 0 for contributor who just bought tokens');
    })

  })
});
