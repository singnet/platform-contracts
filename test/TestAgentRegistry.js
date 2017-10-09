const AgentRegistry = artifacts.require('registries/AgentRegistry.sol');


contract('AgentRegistry', function (accounts) {

    let registry

    beforeEach(async () => {
        registry = await AgentRegistry.new()
    })

    it('verifies that agent can be added to registry', async () => {

        let result = await registry.addAgent(
            0,
            1,
            20,
            accounts[2]
        )

        assert.equal(result.logs[0].event, 'AgentAdded', 'Agent was not added')
    })

    it('returns agent data at 0 position', async () => {

        await registry.addAgent(
            0,
            1,
            20,
            accounts[2]
        )

        let result = await registry.getAgent.call(0)
        assert.isNotNull(result)
    })

    it('returns agents with service 0', async () => {

        await registry.addAgent(
            0,
            1,
            20,
            accounts[2]
        )

        let result = await registry.getAgentsWithService.call(0)
      assert.isNotNull(result)
  })
 
})