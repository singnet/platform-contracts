const Escrow = artifacts.require('registries/Escrow.sol');


contract('Escrow', function () {

    let escrow

    beforeEach(async () => {
        escrow = await Escrow.new("0xf8d5c5ecb8f302f3e56af050f86633059ad10328")
    })

    /*
    it('verifies that agent can be added to escrow', async () => {
        assert.equal(result.logs[0].event, 'AgentAdded', 'Agent was not added')
    })
    */
    
    it('returns beneficiary', async () => {
        let result = await escrow.beneficiary.call()
        assert.isNotNull(result)
    })

    it('verifies that owner can release the funds', async () => {
        let result = await escrow.releaseFunds()
        assert.isNotNull(result)
    })
 
})