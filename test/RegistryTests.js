"use strict";

let IRegistry = artifacts.require("IRegistry");
let Registry = artifacts.require("Registry");

let { STRINGS, AGENT_STATE, JOB_STATE, TX_STATUS, HELPERS } = require("./util/Util.js");
let { signAddress, bytesToString, addressToString, intRange, assertArraysEqual, generateSelectorArray, generateInterfaceId } = HELPERS;
let { dimensionalTraversal } = require("./util/DimensionalTraversal.js");
require("./util/CollectionExtensions");

// use triple equals for all equality and inequality checks
assert.equal    = assert.strictEqual;
assert.notEqual = assert.notStrictEqual;


// This test suite dynamically generates test cases with different amounts of orgs, services, type repos, and tags.
// The following parameters define what tests are generated.
//
// For example, if start.Orgs = 1, end.Orgs = 10, and increment.Orgs = 3, tests will be generated for
// 1, 3, 6, and 9 orgs and all the combinations of the other parameters.

const start = Object.freeze({
     Orgs     : 2,
     Services : 5,
});

const end = Object.freeze({
     Orgs     : 2,
     Services : 5,
});

const increment = Object.freeze({
    Orgs     : 1,
    Services : 1,
});

const doTest = () => {
    const generationStart = Date.now();

    dimensionalTraversal(Object.values(start), Object.values(end), Object.values(increment), (vector) => {
        console.log('Generating test suite for vector: ', vector);
        runDynamicTestSuite.apply(this, vector);
    });

    console.log(`Time spent generating tests: ${Math.floor((Date.now() - generationStart) / 1000)}s`);
};


const runDynamicTestSuite = (suite_numOrgs, suite_servicesPerOrg) => {

    contract(`Registry Integration Tests | numOrgs: ${suite_numOrgs}, servicesPerOrg: ${suite_servicesPerOrg}`, async (accounts) => {

        before(async () => {
            s.RegistryInstance = await Registry.deployed();
        });

        // test constants
        const c = Object.freeze({
            OrganizationCount: 10,
            OrganizationId: "MetaCortexId",
            OrganizationName: "MetaCortex", // name of the organization
            CreatorAccount: accounts[0],
            Format: Object.freeze({
                getOrgId        : (i) => `${c.OrganizationId}_${i}`,
                getOrgName        : (i) => `${c.OrganizationName}_${i}`,
                getMemberAddress  : (i) => `0x${String(i).padStart(40, '0')}`,
                getServiceId    : (orgId, i) => `${orgId}_Service_${i}`,
                getMetaUri        : (orgId, repoId) => 'ipfs://' + web3.utils.fromAscii(`${repoId}-${orgId}`).substring(0, 50)
            })
        });

        // test state
        const s = Object.seal({
            RegistryInstance: null,
            Data: Object.seal({
                Orgs: new Set(),
                OrgsToServices: new Map()
            })
        });

        const convertTags = (_tags) => {
            let _tagsConverted = [];
            if(_tags) {
                _tagsConverted = _tags.map(t => web3.utils.asciiToHex(t));
            }
            return _tagsConverted;
        }

        // contract interaction CRUD functions
        // they should all return { receipt, view }
        //  - receipt is the tx receipt of the CRUD function
        //  - view is the return value of the corresponding view function
        //      - ex: createOrganization's view function is getOrganizationById
        //            deleteServiceRegistration's view function is getServiceRegistrationById
        //
        //  also keeps track of what should be in the contract in s.Data. We validate against this data later.

        const createOrganization = async (_orgId, _orgMetadataURI, _membersArray) => {

            const createResult = await s.RegistryInstance.createOrganization(web3.utils.asciiToHex(_orgId), web3.utils.asciiToHex(_orgMetadataURI), _membersArray);
            s.Data.Orgs.add(_orgId);
            const {found, id, orgMetadataURI, owner, members, serviceIds} = await s.RegistryInstance.getOrganizationById.call(web3.utils.asciiToHex(_orgId));
            return {receipt: createResult.receipt, view: {found, id, orgMetadataURI, owner, members, serviceIds}};
        };

        const deleteOrganization = async (_orgId) => {

            const deleteResult = await s.RegistryInstance.deleteOrganization(web3.utils.asciiToHex(_orgId));

            s.Data.OrgsToServices.getOrCreateSet(_orgId);

            s.Data.Orgs.delete(_orgId);
            s.Data.OrgsToServices.delete(_orgId);

            const {found, id, orgMetadataURI, owner, serviceIds} = await s.RegistryInstance.getOrganizationById.call(web3.utils.asciiToHex(_orgId));

            return {receipt: deleteResult.receipt, view: {found, id, orgMetadataURI, owner, serviceIds}};
        };

        const createService = async (_orgId, _serviceId, _metadataURI) => {

            const createResult = await s.RegistryInstance.createServiceRegistration(web3.utils.asciiToHex(_orgId), web3.utils.asciiToHex(_serviceId), web3.utils.asciiToHex(_metadataURI));

            s.Data.OrgsToServices.getOrCreateSet(_orgId).add(_serviceId);

            const {found, id, metadataURI} = await s.RegistryInstance.getServiceRegistrationById.call(web3.utils.asciiToHex(_orgId), web3.utils.asciiToHex(_serviceId));

            return {receipt: createResult.receipt, view: {found, name: id, metadataURI}};
        };

        const deleteService = async (_orgId, _serviceId) => {

            const deleteResult = await s.RegistryInstance.deleteServiceRegistration(web3.utils.asciiToHex(_orgId), web3.utils.asciiToHex(_serviceId));

            s.Data.OrgsToServices.getOrCreateSet(_orgId).delete(_serviceId);

            const {found, id, metadataURI} = await s.RegistryInstance.getServiceRegistrationById.call(web3.utils.asciiToHex(_orgId), web3.utils.asciiToHex(_serviceId));

            return {receipt: deleteResult.receipt, view: {found, name: id, metadataURI}};
        };


        // helpers for local data store

        /**
         * Asserts that the smart contract state matches the in-memory state
         */
        const validateAllTheThings = async (
            /* Set<String>              */ _orgIds, 
            /* Map<String, Set<String>> */ _orgsToServices) => {

            // validate top level orgs and tags
            const orgIds = (await s.RegistryInstance.listOrganizations.call()).map(bytesToString);
            assertArraysEqual(assert.equal, [..._orgIds], orgIds, "listOrganizations returned unexpected org names");

            // validate org->service mappings
            await _orgsToServices.forEachAsync(async (orgId, services) => {

                const {found, serviceIds} = await s.RegistryInstance.listServicesForOrganization.call(web3.utils.asciiToHex(orgId));

                const serviceIdsDecoded = serviceIds.map(bytesToString);

                assertArraysEqual(assert.equal, [...services], serviceIdsDecoded
                    , "listServicesForOrganization returned unexpected services for org " + orgId);
            });

        };


        const testLogic = async (numOrgs, servicesPerOrg) => {
            // create numOrgs orgs
            for (let i = 0; i < numOrgs; i++) {
                // setup params
                const orgId = c.Format.getOrgId(i);
                const _orgMetadataURI = c.Format.getMetaUri(orgId, i); //c.Format.getOrgName(i);
                const membersArray = intRange(0, i+1).map(c.Format.getMemberAddress);

                it(`Creates org ${orgId} with ${membersArray.length} members`, async () => {
                    // interact with contract
                    const createResult = await createOrganization(orgId, _orgMetadataURI, membersArray);

                    // validate receipt
                    assert.equal(TX_STATUS.SUCCESS, createResult.receipt.status?TX_STATUS.SUCCESS:TX_STATUS.FAILURE
                        , `createOrganization tx should succeed for ${orgId}`);

                    // destructure view
                    const {found, id, orgMetadataURI, owner, members, serviceIds} = createResult.view;
                    const membersDecoded = members.map(m => addressToString(m));
                    // validate view
                    assert.equal(true, found, "Org not found after registration");
                    assert.equal(orgId, bytesToString(id), "Org registered with the wrong id");
                    assert.equal(_orgMetadataURI, bytesToString(orgMetadataURI), "Org registered with the wrong MetadataURI");
                    assert.equal(c.CreatorAccount, addressToString(owner), "Org registered with the wrong owner");
                    assertArraysEqual(assert.equal, membersArray, membersDecoded, "Org registered with incorrect members");
                    assert.equal(0, serviceIds.length, "Org registered with pre-existing services");
                });
            }

            // create servicesPerOrg services per org
            for (let i = 0; i < numOrgs; i++) {
                for (let j = 0; j < servicesPerOrg; j++) {
                    const orgId = c.Format.getOrgId(i);
                    const serviceId = c.Format.getServiceId(orgId, j);
                    const metadataURI = c.Format.getMetaUri(orgId, j);

                    it(`Creates a service ${serviceId} for org ${orgId} `, async () => {
                        // interact with contract
                        const createResult = await createService(orgId, serviceId, metadataURI);

                        // validate receipt
                        assert.equal(TX_STATUS.SUCCESS, createResult.receipt.status?TX_STATUS.SUCCESS:TX_STATUS.FAILURE, `createService tx should succeed for ${serviceId}`);

                        // destructure view
                        const {found: found, name: viewServiceId, metadataURI: viewMetadataURI} = createResult.view;

                        // validate view
                        assert.equal(true, found, "Service not found after registration");
                        assert.equal(serviceId, bytesToString(viewServiceId), "Service registered with the wrong name");
                        assert.equal(metadataURI, bytesToString(viewMetadataURI),  "Service registered with the wrong uri");
                    });
                }
            }


            // VALIDATE ALL THE THINGS

            it(`VALIDATE ALL THE THINGS!`, async () => await validateAllTheThings(s.Data.Orgs, s.Data.OrgsToServices));

            // delete the first, middle, last service
            let remainingServiceIndexes = [];
            for (let i = 0; i < numOrgs; i++) {
                const orgId = c.Format.getOrgId(i);

                let serviceIndexesToDelete = [];

                if (servicesPerOrg > 0) {
                    serviceIndexesToDelete.push(0); // delete the first service
                }

                if (servicesPerOrg > 1) {
                    serviceIndexesToDelete.push(servicesPerOrg - 1); // delete the last service
                }

                if (servicesPerOrg > 2) {
                    serviceIndexesToDelete.push(Math.floor(servicesPerOrg / 2)); // delete a middle service
                }

                serviceIndexesToDelete.forEach(serviceIndex => {
                    const serviceId = c.Format.getServiceId(orgId, serviceIndex);

                    it(`Deletes ${serviceId} from ${orgId}`, async () => {

                        const deleteResult = await deleteService(orgId, serviceId);

                        assert.equal(TX_STATUS.SUCCESS, deleteResult.receipt.status?TX_STATUS.SUCCESS:TX_STATUS.FAILURE, `deleteService should succeed for ${serviceId}`);

                        const {found: found, name: viewServiceId} = deleteResult.view;
                        assert.equal(false, found, "Service was still found after deletion");
                    });
                });

                remainingServiceIndexes = intRange(0, servicesPerOrg).difference(serviceIndexesToDelete);
            }

            it(`VALIDATE - after deleting services`, async () =>
                await validateAllTheThings(s.Data.Orgs, s.Data.OrgsToServices));


            // delete first, middle, last org
            let remainingOrgIndexes = [];
            {
                let orgIndexesToDelete = [];

                if (numOrgs > 0) {
                    orgIndexesToDelete.push(0);
                }

                if (numOrgs > 1) {
                    orgIndexesToDelete.push(numOrgs - 1);
                }

                if (numOrgs > 2) {
                    orgIndexesToDelete.push(Math.floor(numOrgs / 2));
                }

                orgIndexesToDelete.forEach(orgIndex => {
                    const orgId = c.Format.getOrgId(orgIndex);

                    it(`Deletes org ${orgId}`, async () => {

                        const deleteResult = await deleteOrganization(orgId);

                        assert.equal(TX_STATUS.SUCCESS, deleteResult.receipt.status?TX_STATUS.SUCCESS:TX_STATUS.FAILURE, `deleteOrg should succeed for ${orgId}`);

                        // destructure view
                        const {found, name, owner, serviceIds} = deleteResult.view;

                        // validate view
                        assert.equal(false, found, "Org still found after deletion");
                    });
                });

                remainingOrgIndexes = intRange(0, numOrgs).difference(orgIndexesToDelete);
            }

            it(`VALIDATE - after deleting orgs`, async () => {
                await validateAllTheThings(s.Data.Orgs, s.Data.OrgsToServices)
            });

        };

        await testLogic(suite_numOrgs, suite_servicesPerOrg) ;
    });
};

// ERC165 tests
contract(`Registry ERC-165 test`, async (accounts) => {

    it(`Validates the IRegistry ERC165 identifier`, async () => {
        const identifier = generateInterfaceId(generateSelectorArray(IRegistry));

        assert.equal(STRINGS.REGISTRY_ERC165_ID, identifier, "incorrect IRegistry ERC165 identifier");
    });

    // Registry will always have supportsInterface which will change the ID
    it(`Validates that Registry and IRegistry have different identifiers`, async () => {

        const registryIdentifier  = generateInterfaceId(generateSelectorArray(Registry));
        const iregistryIdentifier = generateInterfaceId(generateSelectorArray(IRegistry));

        assert.notEqual(registryIdentifier, iregistryIdentifier, "Registry and IRegistry should never have the same identifier");
    });

    it(`Validates that the deployed Registry indicates support of registry ID`, async () => {
        const registryInstance = await Registry.deployed();

        const supportsRegistryId = await registryInstance.supportsInterface.call(STRINGS.REGISTRY_ERC165_ID);

        assert.equal(true, supportsRegistryId, `Registry does not indicate support of published interface id ${STRINGS.REGISTRY_ERC165_ID}`);
    });
});

// Registry functional tests
doTest();