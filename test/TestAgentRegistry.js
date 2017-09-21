const AgentRegistry = artifacts.require('registries/AgentRegistry.sol');


contract('AgentRegistry', function () {

    let registry

    beforeEach(async () => {
        registry = await AgentRegistry.new()
    })

    it('verifies that agent can be added to registry', async () => {

        let result = await registry.addAgent(
            0,
            "0xf8d5c5ecb8f302f3e56af050f86633059ad10328"
        )

        assert.equal(result.logs[0].event, 'AgentAdded', 'Agent was not added')
    })

    it('returns agent data at 0 position', async () => {

        await registry.addAgent(
            0,
            "0xf8d5c5ecb8f302f3e56af050f86633059ad10328"
        )

        let result = await registry.getAgent.call(0)
        assert.isNotNull(result)
    })

    it('returns agents with service 0', async () => {

        await registry.addAgent(
            0,
            "0xf8d5c5ecb8f302f3e56af050f86633059ad10328"
        )

        let result = await registry.getAgentsWithService.call(0)
      assert.isNotNull(result)
  })
 
})