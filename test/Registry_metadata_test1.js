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
            let orgId     = web3.utils.asciiToHex("TestId");
            let orgName     = web3.utils.asciiToHex("Original Org Name");
            let orgName2     = web3.utils.asciiToHex("Updated Org Name");
            let serviceId = web3.utils.asciiToHex("ServiceId");
            let metadataURI = web3.utils.asciiToHex("ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U9B");
            let metadataURI_Updated = web3.utils.asciiToHex("ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U6B");
            let orgMetadataURI = web3.utils.asciiToHex("ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U8B");
            let orgMetadataURI2 = web3.utils.asciiToHex("ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U7B");

            await registry.createOrganization(orgId, orgMetadataURI, [accounts[1]]);

            await registry.createServiceRegistration(orgId, serviceId, metadataURI)
            let rez = await registry.getServiceRegistrationById(orgId, serviceId)
            assert.equal(rez[2], metadataURI)

            //update service registration
            await registry.updateServiceRegistration(orgId, serviceId, metadataURI_Updated)
            let rez2 = await registry.getServiceRegistrationById(orgId, serviceId)
            assert.equal(rez2[2], metadataURI_Updated)

            let rez3 = await registry.getOrganizationById(orgId);
            assert.equal(rez3[2], orgMetadataURI);

            await registry.changeOrganizationMetadataURI(orgId, orgMetadataURI2);
            let rez4 = await registry.getOrganizationById(orgId);
            assert.equal(rez4[2], orgMetadataURI2);

        });
});
