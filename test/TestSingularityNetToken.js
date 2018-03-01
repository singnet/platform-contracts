const SingularityNetToken = artifacts.require('./helpers/SingularityNetToken.sol')
const Crowdsale = artifacts.require('./helpers/AgiCrowdsale.sol')
const PUBLIC_SUPPLY = new web3.BigNumber(150000000 *  Math.pow(10, 8))


const assertFail = require('./helpers/assertFail.js')
const { increaseTimeTo } = require('./helpers/increaseTime')
const { latestTime, duration } = require('./helpers/latestTime')

contract('SingularityNetToken', (accounts) => {

  beforeEach(async () => {
    this.token = await SingularityNetToken.new({ from: accounts[0] })
  })

  it('should have the name Singularity Network Token', async () => {
    assert.equal(await this.token.name.call(), 'SingularityNET Token', "Singularity Network Token wasn't the name")
  })

  it('should have the symbol AGI', async () => {
    assert.equal(await this.token.symbol.call(), 'AGI', "AGI wasn't the symbol")
  })

  it('should have decimals set to 8', async () => {
    assert.equal(await this.token.decimals.call(), 8, "8 wasn't the value of decimals")
  })

  it('should have INITIAL_SUPPLY set to 1e17 cogs', async () => {
    assert.equal(await this.token.INITIAL_SUPPLY.call(), 1e17, "1e17 wasn't the value of INITIAL_SUPPLY units")
  })

  it('should set totalSupply to 1e17 cogs', async () => {
    assert.equal(await this.token.totalSupply.call(), 1e17, "1e17 wasn't the value of totalSupply units")
  })

  it('should set the agiCrowdsale as the new owner and initialize the sale', async () => {
    const miner = await this.token.owner.call()
    const balance = await this.token.balanceOf(miner)
    const startTime = latestTime() + duration.hours(1)
    const endTime = startTime + duration.weeks(1)
    const rate = new web3.BigNumber(1000)
    const goal = new web3.BigNumber(3000 * Math.pow(10, 18))
    const cap = new web3.BigNumber(15000 * Math.pow(10, 18))
    const firstDayCap = new web3.BigNumber(5000 * Math.pow(10, 18))
    
    agiCrowdsale = await Crowdsale.new(this.token.address, accounts[2], startTime, endTime, rate, cap, firstDayCap, goal)
    
    await increaseTimeTo(startTime + duration.days(1))

    //should be the new owner and start the sale
    await this.token.transfer(agiCrowdsale.address, PUBLIC_SUPPLY, {from:accounts[0]})
    await this.token.pause()
    await this.token.transferOwnership(agiCrowdsale.address)
    //Check the new token owner
    assert.equal(await this.token.owner.call(), agiCrowdsale.address, 'Crowdsale is not the owner of the token')
 
  })


  it('should be able to transfer 100 if transfers are unpaused', async () => {
    await this.token.pause({ from: accounts[0] })
    await this.token.unpause({ from: accounts[0] })

    const startingBalance = await this.token.balanceOf(accounts[0])
    await this.token.transfer(accounts[1], 100, { from: accounts[0] })

    const balance0 = await this.token.balanceOf(accounts[0])
    assert.equal(balance0.toNumber(), startingBalance - 100)

    const balance1 = await this.token.balanceOf(accounts[1])
    assert.equal(balance1.toNumber(), 100)
  })

  it('should throw an error trying to transfer while transactions are paused', async () => {
    await this.token.pause()

    try {
      await this.token.transfer(accounts[1], 100)
      
      assert.fail('should have thrown before')
    } catch (error) {
      assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
    }
  })

  it('should throw an error trying to transfer from another account while transactions are paused', async () => {
    await this.token.pause()
    try {
      await this.token.transferFrom(accounts[0], accounts[1], 100)
      
      assert.fail('should have thrown before')
    } catch (error) {
      assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
    }
  })

  it('should not set multiple times the ownership of token', async () => {
    const startTime = latestTime() + duration.hours(1)
    const endTime = startTime + duration.weeks(1)
    const rate = new web3.BigNumber(1000)
    const goal = new web3.BigNumber(3000 * Math.pow(10, 18))
    const cap = new web3.BigNumber(15000 * Math.pow(10, 18))
    const firstDayCap = new web3.BigNumber(5 * Math.pow(10, 18))
    
    agiCrowdsale = await Crowdsale.new(this.token.address, accounts[2], startTime, endTime, rate, cap, firstDayCap, goal)
    await increaseTimeTo(startTime + duration.days(1))

    // First time should be ok
    await this.token.transferOwnership(agiCrowdsale.address)

    // Callisg anthoer time, not
    await assertFail(async () => await this.token.transferOwnership(agiCrowdsale.address), 'should have thrown before')
  })

  it('should transfer tokens to someone if owner', async () => {
    await this.token.transferTokens(accounts[2], 50)
    const balance2 = await this.token.balanceOf(accounts[2])

    assert.equal(balance2.toNumber(), 50)
  })

  it('owner should be able to burn tokens', async () => {
    const { logs } = await this.token.burn(1000000000, { from: accounts[0] });
    const balance = await this.token.balanceOf(accounts[0]);

    assert.equal(balance, 1e17 - 1000000000, 'should be the same')

    const event = logs.find(e => e.event === 'Burn');

    assert.isNotNull(event)
  })

  it('cannot burn more tokens than your balance', async () => {
    try {
      await this.token.burn(2e17, { from: accounts[0] })
      
      assert.fail('should have thrown before')
    } catch (error) {
      assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
    }
  })

})