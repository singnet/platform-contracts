const Factory = artifacts.require('market/MarketJobFactory.sol')
const MarketJob = artifacts.require('market/MarketJob.sol')
const AGIToken = artifacts.require('tokens/SingularityNetTokenMock.sol')

contract('Market Job Factory', function ([agent,payer]) {
  let factory
  let token 

  beforeEach(async () => {
    token = await AGIToken.new(agent,100)
    factory = await Factory.new()
  })
  // master agent: accounts[0]
  it('verifies that an agent can create a market job', async () => {
    const tx = await factory.create.sendTransaction(
      [agent], // agents
      [100], // amounts
      [12300], //id service
      token.address, // token address
      payer, // payer address
      "0x0" // first packet )
    )

    assert.isNotNull(tx)
    const marketJob = await MarketJob.new(tx)
    assert.isNotNull(marketJob.address)

  })


})