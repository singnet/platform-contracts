const Factory = artifacts.require('market/MarketJobFactory.sol')
const AGIToken = artifacts.require('tokens/SingularityNetTokenMock.sol')

contract('Market Job Factory', function (accounts) {
  let factory
  let token 

  beforeEach(async () => {
    token = await AGIToken.new(accounts[0],100)
    factory = await Factory.new()
  })
  // master agent: accounts[0]
  it('verifies that someone can create a market job', async () => {
    const marketJob = await factory.create(
      [accounts[0]], // agents
      [100], // amounts
      [12300], //id service
      token.address, // token address
      accounts[1], // payer address
      "0x0" // first packet )
    )

    assert.isNotNull(marketJob)
  })


})