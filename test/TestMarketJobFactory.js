const Factory = artifacts.require('market/MarketJobFactory.sol')
const MarketJob = artifacts.require('market/MarketJob.sol')
const AGIToken = artifacts.require('tokens/SingularityNetToken.sol')

contract('Market Job Factory', function ([agent, payer]) {
  

  beforeEach(async () => {
    
  })
  // master agent: accounts[0]
  it('verifies that an agent can create a market job', async () => {
    const token = await AGIToken.new(agent, 100)
    const factory = await Factory.new()
    const tx = await factory.create(
      [agent], // agents
      [100], // amounts
      [12300], //id service
      token.address, // token address
      payer, // payer address
      "0x0", // first packet )
      {
        from: agent
      }
    )

    assert.isNotNull(tx)
    
    const marketJob = await MarketJob.new(tx)
    assert.isNotNull(marketJob.address)

    const result = await marketJob.setJobCompleted("0x0", { from: agent })

    assert.equal(result.logs[0].event, 'JobCompleted', 'Job was not completed')    
  })


})