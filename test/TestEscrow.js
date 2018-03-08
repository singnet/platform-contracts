const { duration, latestTime } = require('./helpers/latestTime.js');
const { logGasUsed } = require('./helpers/gas.js')

const Escrow = artifacts.require('market/Escrow.sol')
const Token = artifacts.require('tokens/SingularityNetToken.sol')


const assertFail = require('./helpers/assertFail.js')
const { increaseTimeTo } = require('./helpers/increaseTime')

const amount = new web3.BigNumber(800)


contract('Escrow', function ([payee, payer, validator]) {

  beforeEach(async () => {
    this.timelock = 1000 * 60 * 5 // 5 minutes
    this.token = await Token.new({ from: payer })
    this.escrow = await Escrow.new(token.address, payer, payee, this.timelock, validator, 0)
  })

  it('DEPOSIT and start the Job', async () => {
    const jobDescriptor = "0x01"
    //Complete jobs

    const approveResult = await this.token.approve(this.escrow.address, amount, { from: payer })
    logGasUsed('token.approve',approveResult)
    
    const result = await this.escrow.deposit(amount, jobDescriptor, { from: payer })
    logGasUsed('escrow.deposit',result)

    const found2 = result.logs.find(e => e.event === 'Deposited')
    assert.strictEqual(found2.event, 'Deposited', 'Deposited event not fired')

    const found = result.logs.find(e => e.event === 'Started')
    assert.strictEqual(found.event, 'Started', 'Started event not fired')

  })

  it('JOB COMPLETED - set result', async () => {
    const jobDescriptor = "0x01"    
    const jobResult = "0x202"
    await this.token.approve(this.escrow.address, amount, { from: payer })   
    await this.escrow.deposit(amount, jobDescriptor, { from: payer })
     
    //Complete jobs
    const result = await this.escrow.setResult(jobResult, { from: payee })

    const found = result.logs.find(e => e.event === 'Result')
    assert.strictEqual(found.event, 'Result', 'Result event not fired')

    const found2 = result.logs.find(e => e.event === 'Completed')
    assert.strictEqual(found2.event, 'Completed', 'Completed event not fired')

  })

  it('WITHDRAWAL - try before job completion', async () => {
    const jobDescriptor = "0x01"    
    const jobResult = "0x202"
    await this.token.approve(this.escrow.address, amount, { from: payer })   
    await this.escrow.deposit(amount, jobDescriptor, { from: payer })
    await assertFail(async () => await this.escrow.withdraw({ from: payee }), 'should have thrown before')
  })

  it('WITHDRAWAL - try before timelock expiration time', async () => {
    const jobDescriptor = "0x01"    
    const jobResult = "0x202"
    await this.token.approve(this.escrow.address, amount, { from: payer })   
    await this.escrow.deposit(amount, jobDescriptor, { from: payer })
    await this.escrow.setResult(jobResult, { from: payee })
    await assertFail(async () => await this.escrow.withdraw({ from: payee }), 'should have thrown before')
  })


  it('WITHDRAWAL - allowed if payer accept before timelock', async () => {
    const jobDescriptor = "0x01"    
    const jobResult = "0x202"
    await this.token.approve(this.escrow.address, amount, { from: payer })   
    await this.escrow.deposit(amount, jobDescriptor, { from: payer })
    await this.escrow.setResult(jobResult, { from: payee })
    const result = await this.escrow.accept({from: payer})
    logGasUsed('escrow.setResult',result)

    const found = result.logs.find(e => e.event === 'Accepted')
    assert.strictEqual(found.event, 'Accepted', 'Accepted event not fired')
  })



  it('WITHDRAWAL - allowed after timelock', async () => {
    const jobDescriptor = "0x01"    
    const jobResult = "0x202"
    await this.token.approve(this.escrow.address, amount, { from: payer })   
    await this.escrow.deposit(amount, jobDescriptor, { from: payer })
    await this.escrow.setResult(jobResult, { from: payee })
    const time = (await this.escrow.end.call()) + duration.minutes(10)
    await increaseTimeTo(time)    
    let result = await this.escrow.withdraw({ from: payee })
    logGasUsed('escrow.withdraw',result)
    const found = result.logs.find(e => e.event === 'Withdrew')
    assert.strictEqual(found.event, 'Withdrew', 'Withdrew event not fired')     

  })

})