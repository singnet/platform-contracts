"use strict";
var Registry = artifacts.require("./Registry.sol");
let { HELPERS } = require("./util/Util.js");
let { bytesToString} = HELPERS;

contract('Registry', function(accounts) {

    var registry;
     

    before(async () => 
        {
            registry      = await Registry.deployed();
        });


    it ("set/get metadata", async function()
        { 
            let orgId     = "TestId"
            let orgName     = "Original Org Name"
            let orgName2     = "Updated Org Name" 
            let serviceId = "ServiceId"
            let metadataURI = "ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U9B"
            let orgMetadataURI = "ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U8B"
            let orgMetadataURI2 = "ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U7B"

            await registry.createOrganization(orgId, orgMetadataURI, [accounts[1]]);

            await registry.createServiceRegistration(orgId, serviceId, metadataURI, [])
            let rez = await registry.getServiceRegistrationById(orgId, serviceId)
            assert.equal(web3.toAscii(rez[2]), metadataURI)

            //update service registration
            await registry.updateServiceRegistration(orgId, serviceId, metadataURI + metadataURI)
            let rez2 = await registry.getServiceRegistrationById(orgId, serviceId)
            assert.equal(web3.toAscii(rez2[2]), metadataURI + metadataURI)

            let rez3 = await registry.getOrganizationById(orgId);
            assert.equal(web3.toAscii(rez3[2]), orgMetadataURI);

            await registry.changeOrganizationMetadataURI(orgId, orgMetadataURI2);
            let rez4 = await registry.getOrganizationById(orgId);
            assert.equal(web3.toAscii(rez4[2]), orgMetadataURI2);

        });
});
