const Crowdsale = artifacts.require('./helpers/AgiCrowdsale.sol')
const AGIToken = artifacts.require('SingularityNetToken.sol')
const Vault = artifacts.require('RefundVault.sol')

const { latestTime, duration } = require('./helpers/latestTime')
const { increaseTimeTo } = require('./helpers/increaseTime')

require('chai')
.use(require('chai-as-promised'))
.should()

contract('AgiCrowdsale', async ([miner, firstContributor, secondContributor, whitelisted, blacklisted, wallet]) => {

  beforeEach(async () => {
    const startTime = latestTime() + duration.hours(5)
    const endTime = startTime + duration.weeks(1)
    const rate = new web3.BigNumber(1000)
    const goal = new web3.BigNumber(3 * Math.pow(10, 18))
    const cap = new web3.BigNumber(15 * Math.pow(10, 18))
    const firstDayCap = new web3.BigNumber(5 * Math.pow(10, 18))
    
    this.token = await AGIToken.new({ from: miner })
    this.agiCrowdsale = await Crowdsale.new(this.token.address, wallet, startTime, endTime, rate, cap, firstDayCap, goal, { from: miner })

    await this.token.setOwnership(this.agiCrowdsale.address)
    await this.agiCrowdsale.updateWhitelist([firstContributor, secondContributor], true)
  })

  describe('initialization', () => {

    it('goal should be 3 ETH', async () => {
      const goal = await this.agiCrowdsale.goal()

      assert.equal(goal.toNumber(), web3.toWei(3, 'ether'), "goal is incorrect")
    })

    it('cap should be 15 ETH', async () => {
      const cap = await this.agiCrowdsale.cap()

      assert.equal(cap.toNumber(), web3.toWei(15, 'ether'), "cap is incorrect")
    })

    it('crowdsale contract should be the owner of AGI token', async () => {
      assert.equal(await this.token.owner(), this.agiCrowdsale.address, 'Crowdsale is not the owner of the token')
    })

    it('should not be finalized', async () => {
      const isFinalized = await this.agiCrowdsale.isFinalized()

      assert.isFalse(isFinalized, "isFinalized should be false")
    })

    it('tokens should be paused', async () => {
      assert.isTrue(await this.token.paused(), "token should be paused")
    })

    it('check the balances just after deploy and after crowdsale initialization', async () => {
      assert.equal((await this.token.balanceOf(miner)).toNumber(), 600000000 * 10**8, "The miner should hold 600mil")
      assert.equal((await this.token.balanceOf(this.agiCrowdsale.address)).toNumber(), 400000000 * 10**8, "The Crowdsale should hold 400mil")
    })  

  })

  describe('whitelist', async () => {

    it('should add two contributors into the whitelist', async () => {
      await this.agiCrowdsale.updateWhitelist([whitelisted, blacklisted], true)

      assert.isTrue(await this.agiCrowdsale.isWhitelisted(whitelisted))
      assert.isTrue(await this.agiCrowdsale.isWhitelisted(blacklisted))
    })

    it('should add and remove the same contributor in whitelist', async () => {
      await this.agiCrowdsale.updateWhitelist([blacklisted], true)
      assert.isTrue(await this.agiCrowdsale.isWhitelisted(blacklisted))

      await this.agiCrowdsale.updateWhitelist([blacklisted], false)
      assert.isFalse(await this.agiCrowdsale.isWhitelisted(blacklisted))
    })

    it('only owner can add and remove from whitelist', async () => {
      try {
        await this.agiCrowdsale.updateWhitelist([firstContributor], true, { from:firstContributor })
        
        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }
    })
  })

  describe('sale', async () => {

    it('should not accept purchase before start', async () => {
      try {
        await this.agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(1, 'ether')), from: firstContributor })

        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }
    })

    it('should not accept purchase if cap has been reached', async () => {
      await increaseTimeTo(latestTime() + duration.days(2))

      const { logs } = await this.agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(16, 'ether')), from: secondContributor })          
      const event = logs.find(e => {e.event === 'TokenRefund'})

      assert.isNotNull(event)

      try {
        await this.agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(3, 'ether')), from: secondContributor })                
        
        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }
    })

    it('should accept payments during the sale and issue tokens', async () => {
      await increaseTimeTo(latestTime() + duration.days(2))

      const rate = new web3.BigNumber(1000)
      const weiToCogs = new web3.BigNumber(Math.pow(10, -10))
      const investmentAmount = new web3.BigNumber(web3.toWei(6, 'ether'))
      const expectedCotributorAmount = rate.mul(investmentAmount).mul(weiToCogs)

      await this.agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(6, 'ether')), from: firstContributor })

      const initialSupply = await this.token.INITIAL_SUPPLY.call()
      const contributorAmount = await this.token.balanceOf(firstContributor)

      assert.equal(contributorAmount.toNumber(), expectedCotributorAmount.toNumber())
      assert.equal(initialSupply.toNumber() - contributorAmount.toNumber(), initialSupply.toNumber() - expectedCotributorAmount.toNumber())

      try {
        await this.token.transfer(secondContributor, 100)

        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }

      assert.isFalse(await this.agiCrowdsale.isFinalized(), "isFinalized should be false")   
    })

    it('should throw calling the internal method to buy tokens', async () => {
      try {
        await this.agiCrowdsale.buyTokens({ from: firstContributor, value: web3.toWei(1, 'ether') })

        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('is not a function'), -1, error.message)
      }
    })

    it('should not accept contributions greater than the limit in the first 24 hours', async () => {
      await increaseTimeTo(latestTime() + duration.hours(10))

      try {
        await this.agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(30, 'ether')), from: firstContributor })

        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }
    })

    it('should only accept contributions lower then or equal to the limit in the first 24 hours', async () => {
      await increaseTimeTo(latestTime() + duration.hours(10))      

      const {logs} = await this.agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(3, 'ether')), from: firstContributor })
      const event = logs.find(e => e.event === 'TokenPurchase')

      assert.isNotNull(event)

      //Now should trhow
      try {
        await this.agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(2.5, 'ether')), from: firstContributor })

        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1,  error.message)
      }
    })

    it('could reach the cap in the first 24 hours', async () => {
      await increaseTimeTo(latestTime() + duration.hours(20))
      await this.agiCrowdsale.updateWhitelist([ whitelisted, blacklisted], true)

      await this.agiCrowdsale.sendTransaction({ from: firstContributor, value: web3.toWei(5, 'ether') })
      await this.agiCrowdsale.sendTransaction({ from: secondContributor, value: web3.toWei(5, 'ether') })
      await this.agiCrowdsale.sendTransaction({ from: whitelisted, value: web3.toWei(3, 'ether') })
      await this.agiCrowdsale.sendTransaction({ from: blacklisted, value: web3.toWei(1, 'ether') })

      try {
        await this.agiCrowdsale.sendTransaction({ from: secondContributor, value: web3.toWei(3, 'ether') })

        assert.fail('should have thrown before')
      } catch(error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }

      try {
        await this.agiCrowdsale.sendTransaction({ from: firstContributor, value: web3.toWei(1, 'ether') })

        assert.fail('should have thrown before')
      } catch(error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }

      try {
        await this.agiCrowdsale.sendTransaction({ from: whitelisted, value: web3.toWei(3, 'ether') })
        
        assert.fail('should have thrown before')
      } catch(error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }

      const result = await this.agiCrowdsale.sendTransaction({ from: blacklisted, value: web3.toWei(4, 'ether') })

      assert.isNotNull(result)
    })

  })

  describe('after sale', async () => {

    it('should reject contributions', async () => {
      await increaseTimeTo(latestTime() + duration.weeks(2))

      try {
        await this.agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(1, 'ether')), from: firstContributor })

        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }
    })

    it('should throw claiming funds before the sale is finalized', async () => {
      await increaseTimeTo(latestTime() + duration.weeks(2))

      assert.isTrue(await this.agiCrowdsale.hasEnded())
      try {
        await this.agiCrowdsale.claimRefund({ from: firstContributor })

        assert.fail('should have thrown before')
      } catch (error) {
        assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
      }

    })

    it('the owner could finalize the crowdsale and close the vault', async () => {
      await increaseTimeTo(latestTime() + duration.days(2))
      
      const prevBalance = web3.fromWei(web3.eth.getBalance(await this.agiCrowdsale.wallet()), 'ether').toNumber()

      const value = new web3.BigNumber(web3.toWei(4, 'ether'))
      await this.agiCrowdsale.sendTransaction({ value, from: firstContributor })

      await increaseTimeTo(latestTime() + duration.weeks(2))

      await this.agiCrowdsale.finalize()    

      assert.isTrue(await this.agiCrowdsale.isFinalized.call())

      const vault = Vault.at(await this.agiCrowdsale.vault())
      const vaultState = await vault.state()

      const newBalance = web3.fromWei(web3.eth.getBalance(await this.agiCrowdsale.wallet()), 'ether').toNumber()

      assert.equal(vaultState.toNumber(), 2, 'vault should be closed')
      assert.equal(parseInt(newBalance) - parseInt(prevBalance), web3.fromWei(value, 'ether').toNumber(), 'should be equal')
    })

    it('should refund payers if the goal is not reached', async () => {
      await increaseTimeTo(latestTime() + duration.days(2))
      
      const value = new web3.BigNumber(web3.toWei(1, 'ether'))
      await this.agiCrowdsale.sendTransaction({ value, from: firstContributor })

      await increaseTimeTo(latestTime() + duration.weeks(2))
      await this.agiCrowdsale.finalize()

      const before = web3.fromWei(web3.eth.getBalance(firstContributor), 'ether')
      
      await this.agiCrowdsale.claimRefund({ from: firstContributor })
      const after = web3.fromWei(web3.eth.getBalance(firstContributor), 'ether')

      assert.equal(Math.round(after - before), web3.fromWei(value, 'ether').toNumber())
    })

    it('should enable the owner to claim all unsold tokens', async () => {
      await increaseTimeTo(latestTime() + duration.weeks(2))

      await this.agiCrowdsale.finalize()

      const initialSupply = await this.token.balanceOf(this.agiCrowdsale.address)
      const balanceBeforeClaim = await this.token.balanceOf(miner)

      await this.agiCrowdsale.claimUnsold()

      const finalSupply = await this.token.balanceOf(this.agiCrowdsale.address)
      const balanceAfterClaim = await this.token.balanceOf(miner)

      assert.equal(balanceAfterClaim.toNumber(), initialSupply.toNumber() + balanceBeforeClaim.toNumber())
      assert.equal(finalSupply.toNumber(), 0)
    })

    it('tokens should be unpaused only after finalization', async () => {
      await increaseTimeTo(latestTime() + duration.days(2))

      await this.agiCrowdsale.sendTransaction({ value: new web3.BigNumber(web3.toWei(3, 'ether')), from: firstContributor })

      assert.isTrue(await this.token.paused.call(), 'token should be paused')

      await increaseTimeTo(latestTime() + duration.weeks(2))

      await this.agiCrowdsale.finalize()

      assert.isFalse(await this.token.paused.call(), 'token should be unpaused')
    })
  })

})