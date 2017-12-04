const Crowdsale = artifacts.require('./helpers/AgiCrowdsaleMock.sol')
const AGIToken = artifacts.require('SingularityNetToken.sol')

const { latestTime, duration } = require('./helpers/latestTime')
const { increaseTimeTo } = require('./helpers/increaseTime')

require('chai')
.use(require('chai-as-promised'))
.should();

contract('AgiCrowdsale', async ([miner, firstContributor, secondContributor, whitelisted, blacklisted, wallet]) => {
  let agiCrowdsale
  let token


  beforeEach(async () => {
    token = await AGIToken.new({ from: miner })
    const startTime = latestTime() + duration.seconds(1)
    const endTime = startTime + duration.weeks(1)
    const rate = new web3.BigNumber(1000)
    const goal = new web3.BigNumber(3 * Math.pow(10, 18))
    const cap = new web3.BigNumber(15 * Math.pow(10, 18))
    agiCrowdsale = await Crowdsale.new(token.address, wallet, startTime, endTime, rate, cap, goal, { from: miner })
    await agiCrowdsale.setBlockTimestamp(startTime + duration.days(2))
  })

  describe('initialization', () => {

    it('should not be finalized', async () => {
      const isFinalized = await agiCrowdsale.isFinalized()

      assert.isFalse(isFinalized, "isFinalized should be false")
    })

    it('goal should be 3 ETH', async () => {
      const goal = await agiCrowdsale.goal()
      assert.equal(goal.toNumber(), web3.toWei(3, 'ether'), "goal is incorrect")
    })

    it('cap should be 15 ETH', async () => {
      const cap = await agiCrowdsale.cap()
      assert.equal(cap.toNumber(), web3.toWei(15, 'ether'), "cap is incorrect")
    })

    it('should set the agiCrowdsale as a new owner of AGI token', async () => {
      await token.setOwnership(agiCrowdsale.address)
      const owner = await token.owner.call()
      assert.equal(owner, agiCrowdsale.address, 'Crowdsale is not the owner of the token')
    })

    it('Check the balances just after deploy and after crodsale initialization', async () => {
      assert.equal((await token.balanceOf(miner)).toNumber(), 1e17, "The miner should hold 1 bilion")
      assert.equal((await token.balanceOf(agiCrowdsale.address)).toNumber(), 0, "The Crowdsale should have no balance")
   
      await token.setOwnership(agiCrowdsale.address)
      
      assert.equal((await token.balanceOf(miner)).toNumber(), 600000000 * 10**8, "The miner should hold 600mil")
      assert.equal((await token.balanceOf(agiCrowdsale.address)).toNumber(), 400000000 * 10**8, "The Crowdsale should hold 400mil")
    })  

  })

  describe('whitelist', async () => {

    it('should add two contributors into the whitelist', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor, secondContributor, whitelisted, blacklisted], true)
      assert.isTrue(await agiCrowdsale.isWhitelisted(firstContributor))
      assert.isTrue(await agiCrowdsale.isWhitelisted(secondContributor))
    })

    it('should add and remove the same contributor in whitelist', async () => {
      await agiCrowdsale.updateWhitelist([blacklisted], true)
      assert.isTrue(await agiCrowdsale.isWhitelisted(blacklisted))

      await agiCrowdsale.updateWhitelist([blacklisted], false)
      assert.isFalse(await agiCrowdsale.isWhitelisted(blacklisted))
    })

    it('only owner can add and remove from whitelist', async () => {
      try {
        await agiCrowdsale.updateWhitelist([firstContributor], true, {from:firstContributor})
        assert.fail('should have thrown before')
      } catch (error) {
        assert.ok(error.message.search('invalid opcode'), 'Invalid opcode error must be returned');
      }
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

    it('should not accept purchase after end', async () => {
      await token.setOwnership(agiCrowdsale.address)
      await agiCrowdsale.updateWhitelist([firstContributor], true, {from:miner})
      const startTime = latestTime() + duration.seconds(1)
      const endTime = startTime + duration.weeks(2)
      await increaseTimeTo(endTime + duration.seconds(1))
      try {
        await agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(1, 'ether')), from: firstContributor })
        assert.fail('should have thrown before')
      } catch (error) {
        assert.ok(error.message.search('invalid opcode'),'Invalid opcode error must be returned');
      }
    })

    it('should not accept purchase if cap has reached', async () => {
      await token.setOwnership(agiCrowdsale.address)
      await agiCrowdsale.updateWhitelist([firstContributor,secondContributor], true, {from:miner})
      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.days(2))

      await agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(14, 'ether')), from: secondContributor })          
      const {logs} = await agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(2, 'ether')), from: firstContributor })
      const event = logs.find(e => {e.event === 'TokenRefund'});
      assert.isNotNull(event)
      try {
      await agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(3, 'ether')), from: secondContributor })                
        assert.fail('should have thrown before')
      } catch (error) {
        assert.ok(error.message.search('invalid opcode'),'Invalid opcode error must be returned');
      }

      //Now we check the balances
      console.log(await web3.eth.getBalance(firstContributor))      
    })

    it('should accept payments during the sale and issue tokens', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor], true)

      await token.setOwnership(agiCrowdsale.address)

      const rate = new web3.BigNumber(1000)
      const weiToCogs = new web3.BigNumber(Math.pow(10, -10))
      const startTime = latestTime() + duration.seconds(1)

      const investmentAmount = new web3.BigNumber(web3.toWei(6, 'ether'))
      const expectedCotributorAmount = rate.mul(investmentAmount).mul(weiToCogs)

      await increaseTimeTo(startTime)

      const value = new web3.BigNumber(web3.toWei(6, 'ether'))

      await agiCrowdsale.sendTransaction({ value, from: firstContributor })

      const initialSupply = await token.INITIAL_SUPPLY.call()
      const contributorAmount = await token.balanceOf(firstContributor)

      assert.equal(contributorAmount.toString(), expectedCotributorAmount.toString())
      assert.equal((initialSupply - contributorAmount).toString(), (initialSupply - expectedCotributorAmount).toString())

      try {
        await token.transfer(secondContributor, 100)
        assert.fail('should have thrown before')
      } catch (error) {
        assert.ok(error.message.search('invalid opcode'), 'Invalid opcode error must be returned');
      }


      const isFinalized = await agiCrowdsale.isFinalized()
      assert.isFalse(isFinalized, "isFinalized should be false")   
    })

    it('Passig a null beneficiary to crowdsale should throw ', async () => {
      await token.setOwnership(agiCrowdsale.address)
      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.seconds(10))
      await agiCrowdsale.updateWhitelist([firstContributor], true)
      try {
        await agiCrowdsale.buyTokens(0x0, { from: firstContributor })
        assert.fail('should have thrown before')
      } catch (error) {
        assert.ok(error.message.search('invalid opcode'), error.message);
      }
    })

    it('should not accept contributions greater than the limit in the first 24 hours', async () => {
      await token.setOwnership(agiCrowdsale.address)
      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.hours(10))
      await agiCrowdsale.updateWhitelist([firstContributor], true)
      const value = new web3.BigNumber(web3.toWei(30, 'ether'))

      try {
        await agiCrowdsale.sendTransaction({ value, from: firstContributor })
        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message);
      }
    })

    it('should accept contributions only lower or equal to the limit in the first 24 hours', async () => {
      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.hours(10))      
      await agiCrowdsale.updateWhitelist([firstContributor], true)
      await token.setOwnership(agiCrowdsale.address)

      const value = new web3.BigNumber(web3.toWei(3, 'ether'))
      const {logs} = await agiCrowdsale.sendTransaction({ value, from: firstContributor })
      const event = logs.find(e => e.event === 'TokenPurchase');
      assert.isNotNull(event)
      //Now should trhow
      const value2 = new web3.BigNumber(web3.toWei(2.5, 'ether'))
      try {
        await agiCrowdsale.sendTransaction({ value2, from: firstContributor })
        assert.fail('should have thrown before')
      } catch (error) {
        assert.ok(error.message.search('invalid opcode'), error.message);
      }
    })


    it('should not be able to be refunded before the Crowdsale is finalized', async () => {
      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.weeks(2))
      assert.isTrue(await agiCrowdsale.hasEnded())
      try {
        await token.claimRefund()
        assert.fail('should have thrown before')
      } catch (error) {
        assert.ok((error.message.search('invalid opcode') && true), error.message);
      }

    })

    it('should refund payers if the goal is not reached', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor], true)
      await token.setOwnership(agiCrowdsale.address)

      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.seconds(1))
      
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

    it('Only the owner can unpause token transfers', async () => {
      await token.setOwnership(agiCrowdsale.address)
      try {
        await token.unpause({ from: firstContributor })
        assert.fail('should have thrown before')
      } catch (error) {
        assert.ok(error.message.search('invalid opcode'), error.message);
      }

      try {
        await token.unpause({ from: secondContributor })
        assert.fail('should have thrown before')
      } catch (error) {
        assert.ok(error.message.search('invalid opcode'), error.message);
      }
    })

  })

  describe('after sale', async () => {
    it('the owner can finalize the crowdsale and close the vault', async () => {
      await agiCrowdsale.updateWhitelist([firstContributor], true)
      await token.setOwnership(agiCrowdsale.address)

      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.seconds(1))
      
      const value = new web3.BigNumber(web3.toWei(4, 'ether'))
      await agiCrowdsale.sendTransaction({ value, from: firstContributor })

      await agiCrowdsale.setBlockTimestamp(latestTime() + duration.weeks(2))

      await agiCrowdsale.finalize()    
      assert.isTrue(await agiCrowdsale.isFinalized.call())
    })
  })
})  





