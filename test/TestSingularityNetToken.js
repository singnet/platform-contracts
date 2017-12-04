const SingularityNetToken = artifacts.require('./helpers/SingularityNetTokenMock.sol')
const Crowdsale = artifacts.require('./helpers/AgiCrowdsaleMock.sol')


const { latestTime, duration } = require('./helpers/latestTime')

contract('SingularityNetToken', (accounts) => {

  let token


  beforeEach(async () => {
    token = await SingularityNetToken.new(accounts[0], 1000000000 * 10 ** 8)
  })

  it('should have the name Singularity Network Token', async () => {
    const name = await token.NAME.call()
    assert.equal(name, 'SingularityNET Token', "Singularity Network Token wasn't the name")
  })

  it('should have the symbol AGI', async () => {
    const symbol = await token.SYMBOL.call()
    assert.equal(symbol, 'AGI', "AGI wasn't the symbol")
  })

  it('should have decimals set to 8', async () => {
    const decimals = await token.DECIMALS.call()
    assert.equal(decimals, 8, "8 wasn't the value of decimals")
  })

  it('should have INITIAL_SUPPLY set to 1e17 cogs', async () => {
    const supply = await token.INITIAL_SUPPLY.call()
    assert.equal(supply, 1e17, "1e17 wasn't the value of INITIAL_SUPPLY units")
  })

  it('should set totalSupply to 1e17 cogs', async () => {
    const supply = await token.totalSupply.call()
    assert.equal(supply, 1e17, "1e17 wasn't the value of totalSupply units")
  })

  it('should set the agiCrowdsale as the new owner and initialize the sale', async function () {
    const miner = await token.owner.call()
    const balance = await token.balanceOf(miner)
    const startTime = latestTime() + duration.seconds(1)
    const endTime = startTime + duration.weeks(1)
    const rate = new web3.BigNumber(1000)
    const goal = new web3.BigNumber(3000 * Math.pow(10, 18))
    const cap = new web3.BigNumber(15000 * Math.pow(10, 18))
    agiCrowdsale = await Crowdsale.new(token.address, accounts[2], startTime, endTime, rate, cap, goal)
    await agiCrowdsale.setBlockTimestamp(startTime + duration.days(1))

    //should be the new owner and start the sale
    await token.setOwnership(agiCrowdsale.address)
    //Check the new token owner
    const owner = await token.owner.call()
    assert.equal(owner, agiCrowdsale.address, 'Crowdsale is not the owner of the token')
    //Check the balances
    const balanceAfter = await token.balanceOf(miner)
    const balanceOfCrowdsale = await token.balanceOf(agiCrowdsale.address)
  })


  it('should be able to transfer 100 if transfers are unpaused', async function () {
    await token.pause()
    await token.unpause()

    const startingBalance = await token.balanceOf(accounts[0])
    await token.transfer(accounts[1], 100, { from: accounts[0] })

    const balance0 = await token.balanceOf(accounts[0])
    assert.equal(balance0.toNumber(), startingBalance - 100)

    const balance1 = await token.balanceOf(accounts[1])
    assert.equal(balance1.toNumber(), 100)
  })

  it('should throw an error trying to transfer while transactions are paused', async function () {
    await token.pause()
    try {
      await token.transfer(accounts[1], 100)
      assert.fail('should have thrown before')
    } catch (error) {
      assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
    }
  })

  it('should throw an error trying to transfer from another account while transactions are paused', async function () {
    await token.pause()
    try {
      await token.transferFrom(accounts[0], accounts[1], 100)
      assert.fail('should have thrown before')
    } catch (error) {
      assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
    }
  })

  it('should not set multiple times the ownership of token', async () => {
    const startTime = latestTime() + duration.seconds(1)
    const endTime = startTime + duration.weeks(1)
    const rate = new web3.BigNumber(1000)
    const goal = new web3.BigNumber(3000 * Math.pow(10, 18))
    const cap = new web3.BigNumber(15000 * Math.pow(10, 18))
    agiCrowdsale = await Crowdsale.new(token.address, accounts[2], startTime, endTime, rate, cap, goal)
    await agiCrowdsale.setBlockTimestamp(startTime + duration.days(1))

    // First time should be ok
    await token.setOwnership(agiCrowdsale.address)

    // Callisg anthoer time, not
    try {
      await token.setOwnership(agiCrowdsale.address)

      assert.fail('should have thrown before')
    } catch (error) {
      assert.ok(error.message.search('invalid opcode'), 'Invalid opcode error must be returned');
    }

  })

  it('should transfer tokens to someone if owner', async function () {
    await token.transferTokens(accounts[2], 50)
    const balance2 = await token.balanceOf(accounts[2])
    assert.equal(balance2.toNumber(), 50)
  })

  it('owner should be able to burn tokens', async function () {
    const { logs } = await token.burn(1000000000, { from: accounts[0] });

    const balance = await token.balanceOf(accounts[0]);
    assert.equal(balance, 1e17 - 1000000000, 'should be the same')

    const event = logs.find(e => e.event === 'Burn');
    assert.isNotNull(event)
  })

  it('cannot burn more tokens than your balance', async function () {
    try {
      await token.burn(2e17, { from: accounts[0] })
      assert(false)
    } catch (error) {
      assert.ok(error.message.search('invalid opcode'), 'Invalid opcode error must be returned');
    }
  })

})