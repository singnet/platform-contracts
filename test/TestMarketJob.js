const Market = artifacts.require('market/MarketJob.sol')

contract('Market Job', function (accounts) {
  
  // master agent: accounts[0]
  it('verifies that master agent can create a Market Job', async () => {
    let marketJob = await Market.new(
      [accounts[0], accounts[1], accounts[2], accounts[3]], // agents
      [30, 20, 30, 20], // amounts
      accounts[4], // payer address
      "0x0", "0x0101", // first and last packet)
      {value: 100}
    )

    assert.isNotNull(marketJob)
  })

  it('verifies that any agent allowed can be payed for its job', async () => {
    let market = await Market.new(
        [accounts[0], accounts[1], accounts[2], accounts[3]], // agents
        [30, 20, 30, 20], // amounts
        accounts[4], // payer address
        "0x0", "0x0101", // first and last packet
        {value: 100}
    )

    await market.setJobCompleted()

    let result = await market.withdraw({from: accounts[1]})

    assert.isNotNull(result)
  })

})