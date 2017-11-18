const Factory = artifacts.require('market/MarketJobFactory.sol')

contract('Market Job Factory', function (accounts) {
  let factory

  beforeEach(async () => {
    factory = await Factory.new()
  })
  // master agent: accounts[0]
  it('verifies that someone can create a market job', async () => {
    const marketJob = await factory.create(
      [accounts[0]], // agents
      [100], // amounts
      [12300], //id service
      accounts[1], // payer address
      "0x0" // first packet )
    )

    assert.isNotNull(marketJob)
  })


})