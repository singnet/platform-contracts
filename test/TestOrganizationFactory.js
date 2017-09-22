const Organization = artifacts.require('organization/OrganizationFactory.sol')

contract('OrganizationFactory', function () {

    let organizationFactory

    beforeEach(async () => {
      organizationFactory = await Organization.new()
    })

    it('verifies that somehow can create a new organization', async () => {

        let result = await organizationFactory.create()
        assert.isNotNull(result)

    })
 
})