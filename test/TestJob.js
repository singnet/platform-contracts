const Escrow = artifacts.require('market/Escrow.sol')


contract('Escrow', function ([payee, payer]) {

  beforeEach(async () => {
    const jobDescriptor = "0x0"
    this.job = await Escrow.new(payer, payee, jobDescriptor, 800, 0)
  })


  it('JOB COMPLETED - set result', async () => {
    const jobResult = "0x101"
    //Complete jobs
    const result = await this.job.setResult(jobResult, {from:payee})

    const found = result.logs.find(e => e.event === 'Result')
    assert.strictEqual(found.event, 'Result', 'Result event not fired')

    const found2 = result.logs.find(e => e.event === 'Completed')
    assert.strictEqual(found2.event, 'Completed', 'Completed event not fired')

  })


})