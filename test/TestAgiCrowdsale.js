const Crowdsale = artifacts.require('./helpers/AgiCrowdsaleMock.sol')
const AGIToken = artifacts.require('SingularityNetToken.sol')

const { latestTime, duration } = require('./helpers/latestTime')
const { increaseTimeTo } = require('./helpers/increaseTime')


contract('AgiCrowdsale', async ([miner, firstContributor, secondContributor, wallet]) => {
  let agiCrowdsale
  let token


  beforeEach(async () => {
    token = await AGIToken.new()
    const startTime = latestTime() + duration.seconds(1)
    const endTime = startTime + duration.weeks(1)
    const rate = new web3.BigNumber(1000)
    const goal = new web3.BigNumber(3000 * Math.pow(10, 18))
    const cap = new web3.BigNumber(15000 * Math.pow(10, 18))
    agiCrowdsale = await Crowdsale.new(token.address, wallet, startTime, endTime, rate, cap, goal)
    await agiCrowdsale.setBlockTimestamp(startTime + duration.days(2))
  })

  describe('initialization', () => {

    it('should not be finalized', async () => {
      const isFinalized = await agiCrowdsale.isFinalized()

      assert.isFalse(isFinalized, "isFinalized should be false")
    })

    it('goal should be 3000 ETH', async () => {
      const goal = await agiCrowdsale.goal()
      assert.equal(goal.toString(10), '3000000000000000000000', "goal is incorrect")
    })

    it('cap should be 15000 ETH', async () => {
      const cap = await agiCrowdsale.cap()
      assert.equal(cap.toString(10), '15000000000000000000000', "cap is incorrect")
    })

    it('should set the agiCrowdsale as a new owner of AGI token', async () => {
      await token.setOwnership(agiCrowdsale.address)
      const owner = await token.owner.call()
      assert.equal(owner, agiCrowdsale.address, 'Crowdsale is not the owner of the token')
    })

  })

  describe('whitelist', async () => {

    it('should add two contributors into the whitelist', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor, secondContributor], true)
      assert.isTrue(await agiCrowdsale.isWhitelisted(firstContributor))
      assert.isTrue(await agiCrowdsale.isWhitelisted(secondContributor))
    })

    it('should add and remove the same contributor in whitelist', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor], true)
      assert.isTrue(await agiCrowdsale.isWhitelisted(firstContributor))

      await agiCrowdsale.updateWhitelist([firstContributor], false)
      assert.isFalse(await agiCrowdsale.isWhitelisted(firstContributor))
    })
  })

  describe('sale', async () => {

    it('should not accept purchase before start', async () => {
      try {
        await agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(1, 'ether')), from: firstContributor })

        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
      }
    })

    it('should accept payments during the sale and issue tokens', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor], true)

      await token.setOwnership(agiCrowdsale.address)

      const rate = new web3.BigNumber(1000)
      const weiToCogs = new web3.BigNumber(Math.pow(10, -10))
      const startTime = latestTime() + duration.seconds(1)

      const investmentAmount = new web3.BigNumber(web3.toWei(0.5, 'ether'))
      const expectedCotributorAmount = rate.mul(investmentAmount).mul(weiToCogs)

      await increaseTimeTo(startTime)

      const value = new web3.BigNumber(web3.toWei(0.5, 'ether'))

      await agiCrowdsale.sendTransaction({ value, from: firstContributor })

      const initialSupply = await token.INITIAL_SUPPLY.call()
      const contributorAmount = await token.balanceOf(firstContributor)

      assert.equal(contributorAmount.toString(), expectedCotributorAmount.toString())
      assert.equal((initialSupply - contributorAmount).toString(), (initialSupply - expectedCotributorAmount).toString())

      try {
        await token.transfer(secondContributor, 100)
        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
      }


      const isFinalized = await agiCrowdsale.isFinalized()

      assert.isFalse(isFinalized, "isFinalized should be true")
    })

    it('should not accept contributions greater then the limit in the first 24 hours', async () => {
      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.hours(10))
      await agiCrowdsale.updateWhitelist([firstContributor], true)
      await token.setOwnership(agiCrowdsale.address)

      const value = new web3.BigNumber(web3.toWei(60, 'ether'))

      try {
        await agiCrowdsale.sendTransaction({ value, from: firstContributor })

        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message);
      }
    })

    it('should accept contributions lower then or equal to the limit in the first 24 hours', async () => {
      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.hours(10))
      await agiCrowdsale.updateWhitelist([firstContributor], true)
      await token.setOwnership(agiCrowdsale.address)

      const value = new web3.BigNumber(web3.toWei(40, 'ether'))

      await agiCrowdsale.sendTransaction({ value, from: firstContributor })

      assert.ok(true)
    })

    it('should refund payers if the goal is not reached', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor], true)
      await token.setOwnership(agiCrowdsale.address)

      const value = new web3.BigNumber(web3.toWei(1, 'ether'))

      await agiCrowdsale.sendTransaction({ value, from: firstContributor })
      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.weeks(2))
      await agiCrowdsale.finalize()

      const before = web3.fromWei(web3.eth.getBalance(firstContributor), 'ether')

      await agiCrowdsale.claimRefund({ from: firstContributor })

      const after = web3.fromWei(web3.eth.getBalance(firstContributor), 'ether')

      assert.equal(Math.round(after - before), web3.fromWei(value, 'ether').toString())
    })

    it('should enable the owner to claim all unsold tokens', async () => {
      await token.setOwnership(agiCrowdsale.address)

      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.weeks(2))
      await agiCrowdsale.finalize()

      const initialSupply = await token.balanceOf(agiCrowdsale.address)
      const before = await token.balanceOf(miner)

      await agiCrowdsale.claimUnsold()

      const endSupply = await token.balanceOf(agiCrowdsale.address)
      const after = await token.balanceOf(miner)

      assert.equal(after.toString(), parseInt(initialSupply.toString()) + parseInt(before.toString()))
      assert.equal(endSupply.toString(), 0)
    })

  })

})


