const Agent = artifacts.require('agent/AgentFactory.sol')


contract('AgentFactory', function () {

  let agentFactory

  beforeEach(async () => {
    agentFactory = await Agent.new()
  })

  it('verifies that someone can create a new agent', async () => {

    let result = await agentFactory.create()
    assert.isNotNull(result)

  })

  it('verifies that somehow can create multiple agents', async () => {
    let result = await agentFactory.create()
    let result2 = await agentFactory.create()
    assert.notEqual(result, result2, 'Errors, no multiple agents created')
  })

})