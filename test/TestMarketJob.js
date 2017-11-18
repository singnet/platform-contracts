const Market = artifacts.require('market/MarketJob.sol')

contract('Market Job', function (accounts) {
  
  // master agent: accounts[0]
  it('verifies that master agent can create a Market Job', async () => {
    let marketJob = await Market.new(
      [accounts[0], accounts[1], accounts[2], accounts[3]], // agents
      [30, 20, 30, 20],
      [1, 2, 3, 72], // amounts
      accounts[4], // payer address
      "0x0" // first and last packet)
    )

    assert.isNotNull(marketJob.firstPacket.call())
  })

})