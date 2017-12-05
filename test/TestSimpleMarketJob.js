const Market = artifacts.require('market/SimpleMarketJob.sol')
const AGIToken = artifacts.require('tokens/SingularityNetTokenMock.sol')

contract('Simple Market Job', function ([payer, firstAgent, secondAgent, thirdAgent]) {

  const amount = new web3.BigNumber(300)

  beforeEach(async () => {
    this.token = await AGIToken.new(payer, 1000)
    this.marketJob = await Market.new(
      firstAgent,
      this.token.address, //this.token address
      "0x0", // first bytes packet
      {
        from: payer
      }

    )
  })

  it('DEPOSIT # only the payer can deposit AGI this.token', async () => {
    const escrow = this.marketJob.address
    // console.log(await this.token.balanceOf(payer))
    const watch = this.token.Approval()
    //APPROVE
    await this.token.approve(escrow, amount, { from: payer })
    const allowance = await this.token.allowance.call(payer, escrow)


    assert.equal(watch.get()[0].args.owner, payer)
    assert.equal(watch.get()[0].args.spender, escrow)

    //DEPOSIT
    const result = await this.marketJob.deposit(amount, { from: payer })

    assert.strictEqual(
      (await this.token.balanceOf.call(escrow)).toNumber(),
      amount.toNumber()
    );

    assert.equal(result.logs[0].event, 'Deposited', 'Amount was not deposited')
  })

  it('COMPLETION # only the the master agent can set the job as completed', async () => {
    const hash = '0x01'
    const escrow = this.marketJob.address
    const amount = new web3.BigNumber(1000)
    await this.token.approve(escrow, amount, { from: payer })
    await this.marketJob.deposit(amount, { from: payer })
    // balance after deposit === 0
    assert.equal((await this.token.balanceOf(escrow)).toNumber(), amount, 'Contract Not full empty')

    const result = await this.marketJob.setJobCompleted(hash, { from: firstAgent })
    assert.equal(result.logs[0].event, 'JobCompleted', 'Job was not completed')
  })

  it('APPROVAL # only the the payer can set the job as approved ', async () => {

    const hash = '0x01'
    const escrow = this.marketJob.address
    const amount = new web3.BigNumber(1000)
    await this.token.approve(escrow, amount, { from: payer })
    await this.marketJob.deposit(amount, { from: payer })
    // balance after deposit === 0
    assert.equal((await this.token.balanceOf(escrow)).toNumber(), amount, 'Contract Not full empty')

    await this.marketJob.setJobCompleted(hash, { from: firstAgent })
    const result = await this.marketJob.setJobAccepted()
    const jobAccepted = await this.marketJob.jobAccepted.call()

    assert.equal(jobAccepted, true, 'the job state is euqal to approved')
    assert.equal(result.logs[0].event, 'JobAccepted', 'Job was not approved')
  })

  it('WITHDRAW # only allowed agents can request a withdrawal', async () => {

    const hash = '0x01'

    const escrow = this.marketJob.address

    const amount = new web3.BigNumber(1000)

    await this.token.approve(escrow, amount, { from: payer })
    await this.marketJob.deposit(amount, { from: payer })
    // balance after deposit === 0
    assert.equal((await this.token.balanceOf(escrow)).toNumber(), amount, 'Contract Not full empty')
    await this.marketJob.setJobCompleted(hash, { from: firstAgent })
    await this.marketJob.setJobAccepted({ from: payer })


    /**
     * third agent 
    */
    const resultThird = await this.marketJob.withdraw({ from: firstAgent })


    assert.equal(resultThird.logs[0].event, 'Withdrew', 'Withdrawal in favor of ' + firstAgent + ' was not approved')

    //Final balance === 0

    assert.equal((await this.token.balanceOf(escrow)).toNumber(), 0, 'Contract Not full empty')

    try {
      const tryMore = await this.marketJob.withdraw({ from: firstAgent })
      assert.fail('should have thrown before')
    } catch (error) {
      assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
    }



  })

})