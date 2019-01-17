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

            await registry.createOrganization(orgId, orgName, [accounts[1]]);

            await registry.createServiceRegistration(orgId, serviceId, metadataURI, [])
            let rez = await registry.getServiceRegistrationById(orgId, serviceId)
            assert.equal(web3.toAscii(rez[2]), metadataURI)

            //update service registration
            await registry.updateServiceRegistration(orgId, serviceId, metadataURI + metadataURI)
            let rez2 = await registry.getServiceRegistrationById(orgId, serviceId)
            assert.equal(web3.toAscii(rez2[2]), metadataURI + metadataURI)

            let rez3 = await registry.getOrganizationById(orgId);
            assert.equal(rez3[2], orgName);

            await registry.changeOrganizationName(orgId, orgName2);
            let rez4 = await registry.getOrganizationById(orgId);
            assert.equal(rez4[2], orgName2);

        });

        it ("Delete Operations as Foundation Owner", async function()
        { 
            let orgId     = "TestIdForDelete"
            let orgName     = "Original Org Name For Delete"
            let orgName2     = "Updated Org Name For Delete" 
            let serviceId = "ServiceIdForDelete"
            let metadataURI = "ipfs://QmUfwZ7pEWBE5zSepKpHDaPibQxpPqoEDRo5Kzai8h5U9B"

            // Check for foundationOwner
            const foundationOwner = await registry.foundationOwner.call();
            assert.equal(foundationOwner, accounts[0]);

            await registry.createOrganization(orgId, orgName, [accounts[1]]);

            await registry.createServiceRegistration(orgId, serviceId, metadataURI, ["tag1","tag2"], {from: accounts[1]})
            let rez = await registry.getServiceRegistrationById(orgId, serviceId)
            assert.equal(web3.toAscii(rez[2]), metadataURI)

            // Delete Tags for a Service
            const removeTagResult = await registry.removeTagsFromServiceRegistration(orgId, serviceId, ["tag1","tag2"], {from: accounts[0]});
            assert.equal(1, parseInt(removeTagResult.receipt.status));
            const [ofound0, oname0, ometadataURI0, oserviceTags0] = await registry.getServiceRegistrationById.call(orgId, serviceId, {from: accounts[0]});
            assert.equal(oserviceTags0.length, 0);

            // Delete Service Registration Check by Owner
            const deleteServiceResult = await registry.deleteServiceRegistration(orgId, serviceId, {from: accounts[0]});
            const [ofound1, oname1, ometadataURI1, oserviceTags1] = await registry.getServiceRegistrationById.call(orgId, serviceId, {from: accounts[0]});
            assert.equal(ofound1, false);
            assert.equal(1, parseInt(deleteServiceResult.receipt.status));


            // Delete Org Check by Owner
            const deleteOrgResult = await registry.deleteOrganization(orgId, {from: accounts[0]});
            const [ofound2, oid2, oname2, oowner2, omembers2, oserviceIds2, orepositoryNames2] = await registry.getOrganizationById.call(orgId);
            assert.equal(ofound2, false);
            assert.equal(1, parseInt(deleteOrgResult.receipt.status));

        });
});
