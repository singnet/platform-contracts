const Job = artifacts.require('market/Job.sol')


contract('Job', function ([payer, payee]) {

  beforeEach(async () => {
    this.job = await Job.new()
  })
  
  it('JOB STARTED', async () => {
    const jobDescriptor = "0x0"

    const { logs } = await this.job.setJobStarted(payer, payee, jobDescriptor)
    const found = logs.find(e => e.event === 'JobStarted')
    assert.strictEqual(found.event, 'JobStarted', 'Job not started')
  })

  it('JOB COMPLETED', async () => {
    const jobDescriptor = "0x0"
    const jobResult = "0x0102"

    await this.job.setJobStarted(payer, payee, jobDescriptor)
    //Complete jobs
    const { logs } = await this.job.setJobCompleted(jobResult, {from:payee})
    const found = logs.find(e => e.event === 'JobCompleted')
    assert.strictEqual(found.event, 'JobCompleted', 'Job not completed')
  })


})