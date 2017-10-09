const Agent = artifacts.require('agent/Agentfactory.sol')


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
        let result = await agentFactory.create.call()
        let result2 = await agentFactory.create.call()
        assert.equal(result,result2,'Errors, no multiple agents created')
    })

})