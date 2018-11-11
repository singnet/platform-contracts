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
            let orgName     = "TestName" 
            let serviceName = "ServiceName"
            let metadataURI = "ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U9B"
            await registry.createOrganization(orgName, [accounts[1]]);
            await registry.createServiceRegistration(orgName, serviceName, metadataURI, [])
            let rez = await registry.getServiceRegistrationByName(orgName, serviceName)
            assert.equal(web3.toAscii(rez[2]), metadataURI)

            //update service registration
            await registry.updateServiceRegistration(orgName, serviceName, metadataURI + metadataURI)
            let rez2 = await registry.getServiceRegistrationByName(orgName, serviceName)
            assert.equal(web3.toAscii(rez2[2]), metadataURI + metadataURI)
        });
});
