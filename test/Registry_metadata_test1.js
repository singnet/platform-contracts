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
            let metadata    = "LONG \"BINARY\" STRING 42424242424242424242424242424242424242424242424242424242424"
            await registry.createOrganization(orgName, [accounts[1]]);
            await registry.createServiceRegistration(orgName, serviceName, "", accounts[5], [])
            await registry.setMetadataIPFSHashInServiceRegistration(orgName, serviceName,  metadata)
            let rez = await registry.getMetadataIPFSHash(orgName, serviceName)
            assert.equal(web3.toAscii(rez[1]), metadata)
        });
});
