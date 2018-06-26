"use strict";

let AgentFactory = artifacts.require("AgentFactory");
let Agent = artifacts.require("Agent");
let Registry = artifacts.require("Registry");
let Job = artifacts.require("Job");
let Contract = require("truffle-contract");
let TokenJson = require("singularitynet-token-contracts/SingularityNetToken.json");
let Token = Contract(TokenJson);
let RegistryImpl = artifacts.require("RegistryImpl");

contract("New Registry Test", async (accounts) => {


    it("New Registry tests", async function() {
        let registry = await RegistryImpl.deployed();

        // create an organization
        let org1 = 'my org';
        await registry.createOrganization(org1, []);

        // verify the organization exists
        let orgList = await registry.listOrganizations.call();
        assert.equal(1, orgList.length);
        assert.equal(org1, web3.toAscii(orgList[0]).replace(/\0/g, ''));

        // delete the organization
        await registry.deleteOrganization(org1);

        // verify the organization was deleted
        orgList = await registry.listOrganizations.call();
        assert.equal(0, orgList.length);
        let orgDetails = await registry.getOrganizationByName.call(org1);
        assert.equal(false, orgDetails[0]);

        // recreate the organization
        await registry.createOrganization(org1, []);

        // create a service registration in the organization
        let service1 = 'service 1';
        await registry.createServiceRegistration(org1, service1, "", 0x0, []);

        // verify the service exists
        let serviceList = await registry.listServicesForOrganization(org1);
        assert.equal(service1, web3.toAscii(serviceList[1][0]).replace(/\0/g, ''));

        // create tags for the service
        let tags = ['foo', 'bar'];
        await registry.addTagsToServiceRegistration(org1, service1, tags);

        // verify the tags for the service
        let serviceDetails = await registry.getServiceRegistrationByName.call(org1, service1);
        assert.equal(tags[0], serviceDetails[4].map(item => web3.toAscii(item).replace(/\0/g, ''))[0]);

        await registry.removeTagsFromServiceRegistration(org1, service1, ['bar']);

        // create a 2nd service registration in the organization
        let service2 = 'service 2';
        await registry.createServiceRegistration(org1, service2, "", 0x0, []);

        // delete the first service
        await registry.deleteServiceRegistration(org1, service1);

        // verify only the second service exists
        serviceList = await registry.listServicesForOrganization(org1);
        assert.equal(1, serviceList[1].length);
        assert.equal(service2, web3.toAscii(serviceList[1][0]).replace(/\0/g, ''));

        // list all service tags
        let serviceTags = await registry.listServiceTags.call();

        // list services for a tag
        let services = await registry.listServicesForTag.call(serviceTags[0]);

        // create a type repository registration in the organization
        let typeRepo1 = 'repository 1';
        await registry.createTypeRepositoryRegistration(org1, typeRepo1, "", "", []);

        // // create tags for the type repo
        await registry.addTagsToTypeRepositoryRegistration(org1, typeRepo1, ['baz', 'ball']);

        // list the type repo details
        let typeRepoDetails = await registry.getTypeRepositoryByName.call(org1, typeRepo1);

        // list all the type repo tags
        let typeRepoTags = await registry.listTypeRepositoryTags.call();

        // list type repos for a tag
        let typeRepos = await registry.listTypeRepositoriesForTag.call(typeRepoTags[0]);

        // list organizations
        let orgs = await registry.listOrganizations.call();

        // list organization details
        orgDetails = await registry.getOrganizationByName.call(orgs[0]);
    });
});

let signAddress = (address, account) => {
    let valueHex = "0x" + address.slice(2);
    let h = web3.sha3(valueHex, {encoding: "hex"});
    let sig = web3.eth.sign(account, h).slice(2);
    let r = `0x${sig.slice(0, 64)}`;
    let s = `0x${sig.slice(64, 128)}`;
    let v = web3.toDecimal(sig.slice(128, 130)) + 27;

    return [v, r, s];
};
