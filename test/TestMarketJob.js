const Market = artifacts.require('market/MarketJob.sol')
const AGIToken = artifacts.require('tokens/SingularityNetToken.sol')

contract('Market Job', function (accounts) {
  
  let marketJob
  let token 
  // master agent: accounts[0]
 beforeEach(async () => {
    token = await AGIToken.new()
    marketJob = await Market.new(
      [accounts[0], accounts[1], accounts[2], accounts[3]], // agents
      [30, 20, 30, 20],
      [1, 2, 3, 72], // amounts
      accounts[4], // payer address
      "0x0" // first bytes packet
    )
  })

  it('only the owner should deposit AGI token', async ()=>{
    marketJob.deposit()
  })

})