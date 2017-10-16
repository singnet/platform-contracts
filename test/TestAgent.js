const Agent = artifacts.require('agent/Agent.sol')
const Market = artifacts.require('market/MarketJob.sol')

contract('Agent', function (accounts) {

    let agent

    beforeEach(async () => {
        agent = await Agent.new()
    })

    it('verifies that somehow can append bytes of data to the agent', async () => {

        let result = await agent.appendPacket("0x0")
        assert.isNotNull(result)

    })

    it('verifies that somehow can get bytes of data from the agent', async () => {

        let result = await agent.appendPacket("0x0")
        let packet = await agent.getPacket(0)
        console.log(packet)
        assert.isNotNull(packet)

    })

    it('verifies that somehow can send bytes of data to an agent', async () => {

        const agent2 = await Agent.new()
        
        await agent.appendPacket("0x0101")
        
        let packet = await agent.getPacket(0)

        await agent2.sendPacket(agent2.address,packet)

        let packet2 = await agent2.getPacket(0)

        assert.isNotNull(packet2)

    })

})