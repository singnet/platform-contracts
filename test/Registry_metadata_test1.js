"use strict";
var Registry = artifacts.require("./Registry.sol");

contract('Registry', function(accounts) {

    var registry;
     

    before(async () => 
        {
            registry      = await Registry.deployed();
        });


    it ("set/get metadata", async function()
        { 
            let orgId     = "TestId"
            let orgName     = "TestName" 
            let serviceId = "ServiceId"
            let metadataURI = "ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U9B"
            await registry.createOrganization(orgId, orgName, [accounts[1]]);
            await registry.createServiceRegistration(orgId, serviceId, metadataURI, [])
            let rez = await registry.getServiceRegistrationById(orgId, serviceId)
            assert.equal(web3.toAscii(rez[2]), metadataURI)

            //update service registration
            await registry.updateServiceRegistration(orgId, serviceId, metadataURI + metadataURI)
            let rez2 = await registry.getServiceRegistrationById(orgId, serviceId)
            assert.equal(web3.toAscii(rez2[2]), metadataURI + metadataURI)
        });
});
