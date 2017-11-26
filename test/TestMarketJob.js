const Market = artifacts.require('market/MarketJob.sol')
const AGIToken = artifacts.require('tokens/SingularityNetTokenMock.sol')

contract('Market Job', function ([payer,firstAgent,secondAgent,thirdAgent]) {
  
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
   const amount = new web3.BigNumber(1000) 

   const watch = token.Approval()
   

    await token.approve(marketJob.address, amount, {from: payer})
    const allowance = await token.allowance.call(marketJob.address,payer)
  

    assert.equal(watch.get()[0].args.owner, payer)
    assert.equal(watch.get()[0].args.spender, marketJob.address)

   //console.log(allowance.toNumber())

    await marketJob.deposit(amount)

    assert.strictEqual(
      (await token.balanceOf.call(marketJob.address)).toNumber(),
      amount.toNumber()
    );

    assert.equal(result.logs[0].event, 'Deposited', 'Amount was not deposited')    
  })

  it('COMPLETION # only the the master agent can set the job as completed and trigger an event', async () => {
    const hash = '0x01'
    
    const result = await marketJob.setJobCompleted(hash)
    const jobResult = await marketJob.jobResult.call()

    assert.equal(jobResult, hash, 'Inserted jobResult is different than actual inserted')
    assert.equal(result.logs[0].event, 'JobCompleted', 'Job was not completed')
  })

  it('APPROVAL # only the the payer can set the job as approved ', async () => {
    
    const result = await marketJob.setJobAccepted()
    const jobAccepted = await marketJob.jobAccepted.call()

    assert.equal(jobAccepted, true,'the job state is euqal to approved')
    assert.equal(result.logs[0].event, 'JobApproved', 'Job was not approved') 
  })

  it('WITHDRAW # only allowed agents can request a withdrawal', async () => {
    
    await marketJob.setJobCompleted("0x0")
    await marketJob.setJobAccepted()

    const result = await marketJob.withdraw()
    console.log(result)
    console.log(await token.balanceOf(firstAgent))

    assert.equal(result.logs[0].event, 'Withdrew', 'Withdrawal was not approved')
  })

})