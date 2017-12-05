const Market = artifacts.require('market/MarketJob.sol')
const AGIToken = artifacts.require('tokens/SingularityNetTokenMock.sol')

contract('Market Job', function ([payer, firstAgent, secondAgent, thirdAgent]) {

  const amounts = [new web3.BigNumber(300), new web3.BigNumber(300), new web3.BigNumber(400)]


  it('DEPOSIT # only the payer can deposit AGI token', async () => {
    const token = await AGIToken.new(payer, 1000)
    const marketJob = await Market.new(
      [firstAgent, secondAgent, thirdAgent], // agents
      amounts, //amounts
      [101, 102, 103], // services id
      token.address, //token address
      payer, // payer address
      "0x0", // first bytes packet
      {
        from: firstAgent
      }

    )
    const escrow = marketJob.address
    // console.log(await token.balanceOf(payer))
    const amount = new web3.BigNumber(1000)
    const watch = token.Approval()
    //APPROVE
    await token.approve(escrow, amount)
    const allowance = await token.allowance.call(payer, escrow)


    assert.equal(watch.get()[0].args.owner, payer)
    assert.equal(watch.get()[0].args.spender, escrow)

    //DEPOSIT
    const result = await marketJob.deposit(amount)

    assert.strictEqual(
      (await token.balanceOf.call(escrow)).toNumber(),
      amount.toNumber()
    );

    assert.equal(result.logs[0].event, 'Deposited', 'Amount was not deposited')
  })

  it('COMPLETION # only the the master agent can set the job as completed', async () => {
    const hash = '0x01'
    const token = await AGIToken.new(payer, 1000)
    const marketJob = await Market.new(
      [firstAgent, secondAgent, thirdAgent], // agents
      amounts, //amounts
      [101, 102, 103], // services id
      token.address, //token address
      payer, // payer address
      "0x0", // first bytes packet
      {
        from: firstAgent
      }
    )
    const escrow = marketJob.address
    const amount = new web3.BigNumber(1000)
    await token.approve(escrow, amount, { from: payer })
    await marketJob.deposit(amount, { from: payer })
    // balance after deposit === 0
    assert.equal((await token.balanceOf(escrow)).toNumber(), amount, 'Contract Not full empty')

    const result = await marketJob.setJobCompleted(hash, { from: firstAgent })
    const jobResult = await marketJob.jobResult.call()

    assert.equal(jobResult, hash, 'Inserted jobResult is different than actual inserted')
    assert.equal(result.logs[0].event, 'JobCompleted', 'Job was not completed')
  })

  it('APPROVAL # only the the payer can set the job as approved ', async () => {

    const hash = '0x01'

    const token = await AGIToken.new(payer, 1000)
    const marketJob = await Market.new(
      [firstAgent, secondAgent, thirdAgent], // agents
      amounts, //amounts
      [101, 102, 103], // services id
      token.address, //token address
      payer, // payer address
      "0x0", // first bytes packet
      {
        from: firstAgent
      }
    )
    const escrow = marketJob.address
    const amount = new web3.BigNumber(1000)
    await token.approve(escrow, amount, { from: payer })
    await marketJob.deposit(amount, { from: payer })
    // balance after deposit === 0
    assert.equal((await token.balanceOf(escrow)).toNumber(), amount, 'Contract Not full empty')

    await marketJob.setJobCompleted(hash, { from: firstAgent })
    const result = await marketJob.setJobAccepted()
    const jobAccepted = await marketJob.jobAccepted.call()

    assert.equal(jobAccepted, true, 'the job state is euqal to approved')
    assert.equal(result.logs[0].event, 'JobAccepted', 'Job was not approved')
  })

  it('WITHDRAW # only allowed agents can request a withdrawal', async () => {

    const hash = '0x01'

    const token = await AGIToken.new(payer, new web3.BigNumber(1000))
    const marketJob = await Market.new(
      [firstAgent, secondAgent, thirdAgent], // agents
      amounts, //amounts
      [101, 102, 103], // services id
      token.address, //token address
      payer, // payer address
      "0x0", // first bytes packet
      {
        from: firstAgent
      }
    )
    const escrow = marketJob.address

    const amount = new web3.BigNumber(1000)

    await token.approve(escrow, amount, { from: payer })
    await marketJob.deposit(amount, { from: payer })
    // balance after deposit === 0
    assert.equal((await token.balanceOf(escrow)).toNumber(), amount, 'Contract Not full empty')
    await marketJob.setJobCompleted(hash, { from: firstAgent })
    await marketJob.setJobAccepted({ from: payer })


    /**
     * third agent 
    */
    const resultThird = await marketJob.withdraw({ from: thirdAgent })

    assert.strictEqual(
      (await token.balanceOf.call(thirdAgent)).toNumber(),
      amounts[2].toNumber()
    );

    assert.equal(resultThird.logs[0].event, 'Withdrew', 'Withdrawal in favor of ' + thirdAgent + ' was not approved')

    /**
     * second agent 
    */
    const resultSecond = await marketJob.withdraw({ from: secondAgent })

    assert.strictEqual(
      (await token.balanceOf.call(secondAgent)).toNumber(),
      amounts[1].toNumber()
    );

    assert.equal(resultSecond.logs[0].event, 'Withdrew', 'Withdrawal in favor of ' + secondAgent + ' was not approved')

    /**
     * first agent 
    */

    const resultFirst = await marketJob.withdraw({ from: firstAgent })

    assert.strictEqual(
      (await token.balanceOf.call(firstAgent)).toNumber(),
      amounts[1].toNumber()
    );

    assert.equal(resultFirst.logs[0].event, 'Withdrew', 'Withdrawal in favor of ' + firstAgent + ' was not approved')

    //Final balance === 0

    assert.equal((await token.balanceOf(escrow)).toNumber(), 0, 'Contract Not full empty')

    try {
      const tryMore = await marketJob.withdraw({ from: firstAgent })
      assert.fail('should have thrown before')
    } catch (error) {
      assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
    }



  })

})