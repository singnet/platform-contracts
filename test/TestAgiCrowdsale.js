const Crowdsale = artifacts.require('./helpers/AgiCrowdsaleMock.sol')
const AGIToken = artifacts.require('SingularityNetToken.sol')

const { latestTime, duration } = require('./helpers/latestTime')
const  { increaseTimeTo } = require('./helpers/increaseTime')


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
    await agiCrowdsale.setBlockTimestamp(startTime + duration.days(1))
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

  })

  describe('whitelist', async () => {

    it('should add two contributors into the whitelist', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor, secondContributor], 1, true)
      assert.isTrue(await agiCrowdsale.isWhitelisted(firstContributor))
      assert.isTrue(await agiCrowdsale.isWhitelisted(secondContributor))
    })

    it('should add and remove the same contributor in whitelist', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor], 1, true)
      assert.isTrue(await agiCrowdsale.isWhitelisted(firstContributor))

      await agiCrowdsale.updateWhitelist([firstContributor], 1, false)
      assert.isFalse(await agiCrowdsale.isWhitelisted(firstContributor))
    })

    // it('should set the agiCrowdsale as a new owner of AGI token', async () => {
    //   await token.setOwnership(agiCrowdsale.address)
    //   const owner = await token.owner.call()
    //   assert.equal(owner, agiCrowdsale.address, 'Crowdsale is not the owner of the token')
    // })
  })

  describe('sale', async () => {

    it('should not accept purchase before start', async () => {
      try {
        await agiCrowdsale.sendTransaction({value:new web3.BigNumber(web3.toWei(1, 'ether')),from:firstContributor})
        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
      }
    })

    it('should accept payments during the sale', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor], 1, true)
      
      await token.setOwnership(agiCrowdsale.address)

      const rate = new web3.BigNumber(1000)
      const weiToCogs = new web3.BigNumber(Math.pow(10,-10))
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
    });

    it('should purchase tokens', async () => {
      assert.isFalse(await agiCrowdsale.isWhitelisted(firstContributor))

      await agiCrowdsale.updateWhitelist([firstContributor], 1, true)
      assert.isTrue(await agiCrowdsale.isWhitelisted(firstContributor))

      const balance = await token.balanceOf(firstContributor)
      assert.equal(balance.toNumber(), 0)

     // await token.setOwnership(agiCrowdsale.address)

      const value = web3.toWei(1, 'ether')
      const balanceAfter = await token.balanceOf(firstContributor)
      assert.equal(balanceAfter.toNumber(), 0)
      //const contributedAmount = await agiCrowdsale.whitelist.call(firstContributor).contributedAmount
      //assert.isTrue(contributedAmount.toNumber(10) > 0, 'balanceOf is 0 for contributor who just bought tokens') 
    })
  })
})
  
