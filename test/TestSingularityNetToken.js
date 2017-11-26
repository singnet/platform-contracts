const SingularityNetToken = artifacts.require('./helpers/SingularityNetTokenMock.sol')
const Crowdsale = artifacts.require('./helpers/AgiCrowdsaleMock.sol')


const { latestTime, duration } = require('./helpers/latestTime')

contract('SingularityNetToken', (accounts) => {

  let token


  beforeEach(async () => {
    token = await SingularityNetToken.new(accounts[0], 100)
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

  it('should be able to transfer if transfers are unpaused', async function () {
    // await token.unpause()

    await token.transfer(accounts[1], 100)

    const balance0 = await token.balanceOf(accounts[0])
    assert.equal(balance0.toNumber(), 0)

    const balance1 = await token.balanceOf(accounts[1])
    assert.equal(balance1.toNumber(), 100)
  })

  it('should be able to transfer after transfers are paused and unpaused', async function () {
    await token.pause()
    await token.unpause()

    await token.transfer(accounts[1], 100)

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

  it('should set the agiCrowdsale as the new owner', async function () {
    const startTime = latestTime() + duration.seconds(1)
    const endTime = startTime + duration.weeks(1)
    const rate = new web3.BigNumber(1000)
    const goal = new web3.BigNumber(3000 * Math.pow(10, 18))
    const cap = new web3.BigNumber(15000 * Math.pow(10, 18))
    agiCrowdsale = await Crowdsale.new(token.address, accounts[2], startTime, endTime, rate, cap, goal)
    await agiCrowdsale.setBlockTimestamp(startTime + duration.days(1))
    await token.setOwnership(agiCrowdsale.address)
    const owner = await token.owner.call()
    assert.equal(owner, agiCrowdsale.address, 'Crowdsale is not the owner of the token')
  })

  it('should transfer tokens to someone if owner', async function () {
    await token.transferTokens(accounts[2], 50)
    const balance2 = await token.balanceOf(accounts[2])
    assert.equal(balance2.toNumber(), 50)
  })

})