const Agent = artifacts.require('agent/Agentfactory.sol')


contract('AgentFactory', function () {

    let agentFactory

    beforeEach(async () => {
      agentFactory = await Agent.new()
    })

    it('verifies that somehow can acreate a new agent', async () => {

        let result = await agentFactory.create()
        assert.isNotNull(result)

    })
 
})