const Market = artifacts.require('market/MarketJob.sol')
const AGIToken = artifacts.require('tokens/SingularityNetTokenMock.sol')

contract('Market Job', function ([firstAgent,secondAgent,thirdAgent,payer]) {
  
  let marketJob
  let token 
  const  amounts = [30, 40, 30]
 beforeEach(async () => {
    token = await AGIToken.new(payer,100)
    marketJob = await Market.new(
      [firstAgent, secondAgent, thirdAgent], // agents
      amounts, //amounts
      [101, 102, 103], // services id
      token.address, //token address
      payer, // payer address
      "0x0" // first bytes packet
    )
  })

  it('only the payer can deposit AGI token', async () => {
   // console.log(await token.balanceOf(payer))

    const amount = 99 
    await token.approve(marketJob.address, amount);

    const result = await marketJob.deposit(amount,{from:payer})
    assert.equal(result.logs[0].event, 'Deposited', 'Amount was not deposited')    
  })

  it('only the the master agent can set the job as completed and trigger an event', async () => {
    const hash = '0x01'
    
    const result = await marketJob.setJobCompleted(hash)
    const jobResult = await marketJob.jobResult.call()

    assert.equal(jobResult, hash, 'Inserted jobResult is different than actual inserted')
    assert.equal(result.logs[0].event, 'JobCompleted', 'Job was not completed')
  })

  it('only the the payer can set the job as approved and trigger an event', async () => {
    
    const result = await marketJob.setJobAccepted({from:payer})
    const jobAccepted = await marketJob.jobAccepted.call()

    assert.equal(jobAccepted,true,'the job state is euqal to approved')
    assert.equal(result.logs[0].event, 'JobApproved', 'Job was not approved') 
  })

  it('only allowed agents can request a withdrawal', async () => {
    
    const amount = amounts[0]
    
    await token.approve(firstAgent, amount);
    
    const result = await marketJob.withdraw({from:firstAgent})

    assert.equal(result.logs[0].event, 'Withdrew', 'Withdrawal was not approved')
  })

})