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
     TypeRepos: 5,
     Tags     : 10
});

const end = Object.freeze({
     Orgs     : 2,
     Services : 5,
     TypeRepos: 5,
     Tags     : 10
});

const increment = Object.freeze({
    Orgs     : 1,
    Services : 1,
    TypeRepos: 1,
    Tags     : 1
});

const doTest = () => {
    const generationStart = Date.now();

    dimensionalTraversal(Object.values(start), Object.values(end), Object.values(increment), (vector) => {
        console.log('Generating test suite for vector: ', vector);
        runDynamicTestSuite.apply(this, vector);
    });

    console.log(`Time spent generating tests: ${Math.floor((Date.now() - generationStart) / 1000)}s`);
};


const runDynamicTestSuite = (suite_numOrgs, suite_servicesPerOrg, suite_reposPerOrg, suite_numTags) => {

    contract(`Registry Integration Tests | numOrgs: ${suite_numOrgs}, servicesPerOrg: ${suite_servicesPerOrg}, reposPerOrg: ${suite_reposPerOrg}, numTags: ${suite_numTags}`, async (accounts) => {

        before(async () => {
            s.RegistryInstance = await Registry.deployed();
        });

        // test constants
        const c = Object.freeze({
            OrganizationCount: 10,
            OrganizationName: "MetaCortex", // name of the organization
            CreatorAccount: accounts[0],
            Format: Object.freeze({
                getOrgName        : (i) => `${c.OrganizationName}_${i}`,
                getMemberAddress  : (i) => `0x${String(i).padStart(40, '0')}`,
                getServiceName    : (orgName, i) => `${orgName}_Service_${i}`,
                getMetaUri        : (orgName, repoName) => 'ipfs://' + web3.fromAscii(`${repoName}-${orgName}`).substring(0, 50),
                getServiceTagName : (i) => `serviceTagFoo_${i}`,
                getRepoName       : (orgName, i) => `${orgName}_Repo_${i}`,
                getRepoUri        : (orgName, repoName) => 'ipfs://' + web3.fromAscii(`${orgName}-${repoName}`).substring(0, 50),
                getRepoTagName    : (i) => `repoTagFoo_${i}`
            })
        });

        // test state
        const s = Object.seal({
            RegistryInstance: null,
            Data: Object.seal({
                Orgs: new Set(),
                ServiceTags: new Set(),
                RepoTags: new Set(),
                OrgsToServices: new Map(),
                OrgsToRepos: new Map(),
                TagsToServices: new Map(),
                TagsToRepos: new Map()
            })
        });


        // contract interaction CRUD functions
        // they should all return { receipt, view }
        //  - receipt is the tx receipt of the CRUD function
        //  - view is the return value of the corresponding view function
        //      - ex: createOrganization's view function is getOrganizationByName
        //            deleteServiceRegistration's view function is getServiceRegistrationByName
        //
        //  also keeps track of what should be in the contract in s.Data. We validate against this data later.

        const createOrganization = async (_orgName, _membersArray) => {

            const createResult = await s.RegistryInstance.createOrganization(_orgName, _membersArray);

            s.Data.Orgs.add(_orgName);

            const [found, name, owner, members, serviceNames, repositoryNames] = await s.RegistryInstance.getOrganizationByName.call(_orgName);

            return {receipt: createResult.receipt, view: {found, name, owner, members, serviceNames, repositoryNames}};
        };

        const deleteOrganization = async (_orgName) => {

            const deleteResult = await s.RegistryInstance.deleteOrganization(_orgName);

            s.Data.OrgsToServices.getOrCreateSet(_orgName).forEach(deleteAllLocalTagsForService);
            s.Data.OrgsToRepos.getOrCreateSet(_orgName).forEach(deleteAllLocalTagsForRepo);

            s.Data.Orgs.delete(_orgName);
            s.Data.OrgsToServices.delete(_orgName);
            s.Data.OrgsToRepos.delete(_orgName);

            const [found, name, owner, serviceNames, repositoryNames] = await s.RegistryInstance.getOrganizationByName.call(_orgName);

            return {receipt: deleteResult.receipt, view: {found, name, owner, serviceNames, repositoryNames}};
        };

        const createService = async (_orgName, _serviceName, _metadataURI, _tags) => {

            const createResult = await s.RegistryInstance.createServiceRegistration(_orgName, _serviceName, _metadataURI, _tags);

            s.Data.OrgsToServices.getOrCreateSet(_orgName).add(_serviceName);
            updateLocalServiceTagData(_orgName, _serviceName, _tags, true);

            const [found, name, metadataURI, serviceTags] = await s.RegistryInstance.getServiceRegistrationByName.call(_orgName, _serviceName);

            return {receipt: createResult.receipt, view: {found, name, metadataURI, serviceTags}};
        };

        const deleteService = async (_orgName, _serviceName) => {

            const deleteResult = await s.RegistryInstance.deleteServiceRegistration(_orgName, _serviceName);

            s.Data.OrgsToServices.getOrCreateSet(_orgName).delete(_serviceName);

            deleteAllLocalTagsForService(_serviceName);

            const [found, name, metadataURI, serviceTags] = await s.RegistryInstance.getServiceRegistrationByName.call(_orgName, _serviceName);

            return {receipt: deleteResult.receipt, view: {found, name, metadataURI, serviceTags}};
        };

        const createTypeRepository = async (_orgName, _repoName, _repoUri, _tags) => {

            const createResult = await s.RegistryInstance.createTypeRepositoryRegistration(_orgName, _repoName, _repoUri, _tags);

            s.Data.OrgsToRepos.getOrCreateSet(_orgName).add(_repoName);
            updateLocalRepoTagData(_orgName, _repoName, _tags, true);

            const [found, name, repositoryURI, repositoryTags] = await s.RegistryInstance.getTypeRepositoryByName.call(_orgName, _repoName);

            return {receipt: createResult.receipt, view: {found, name, repositoryURI, repositoryTags}};
        };

        const deleteRepo = async (_orgName, _repoName) => {

            const deleteResult = await s.RegistryInstance.deleteTypeRepositoryRegistration(_orgName, _repoName);

            s.Data.OrgsToRepos.getOrCreateSet(_orgName).delete(_repoName);

            deleteAllLocalTagsForRepo(_repoName);

            const [found, name, repositoryURI, repositoryTags] = await s.RegistryInstance.getTypeRepositoryByName.call(_orgName, _repoName);

            return {receipt: deleteResult.receipt, view: {found, name, repositoryURI, repositoryTags}};
        };

        const addTagsToService = async (_orgName, _serviceName, _tags) => {

            const addResult = await s.RegistryInstance.addTagsToServiceRegistration(_orgName, _serviceName, _tags);

            updateLocalServiceTagData(_orgName, _serviceName, _tags, true);

            const [found, name, metadataURI, serviceTags] = await s.RegistryInstance.getServiceRegistrationByName.call(_orgName, _serviceName);

            return {receipt: addResult.receipt, view: {found, name, metadataURI, serviceTags}};
        };

        const addTagsToRepo = async (_orgName, _repoName, _tags) => {

            const addResult = await s.RegistryInstance.addTagsToTypeRepositoryRegistration(_orgName, _repoName, _tags);

            updateLocalRepoTagData(_orgName, _repoName, _tags, true);

            const [found, name, repositoryURI, repositoryTags] = await s.RegistryInstance.getTypeRepositoryByName.call(_orgName, _repoName);

            return {receipt: addResult.receipt, view: {found, name, repositoryURI, repositoryTags}};
        };

        const removeTagsFromService = async (_orgName, _serviceName, _tags) => {

            const removeResult = await s.RegistryInstance.removeTagsFromServiceRegistration(_orgName, _serviceName, _tags);

            updateLocalServiceTagData(_orgName, _serviceName, _tags, false);

            const [found, name, metadataURI, serviceTags] = await s.RegistryInstance.getServiceRegistrationByName.call(_orgName, _serviceName);

            return {receipt: removeResult.receipt, view: {found, name, metadataURI, serviceTags}};
        };

        const removeTagsFromRepo = async (_orgName, _repoName, _tags) => {

            const removeResult = await s.RegistryInstance.removeTagsFromTypeRepositoryRegistration(_orgName, _repoName, _tags);

            updateLocalRepoTagData(_orgName, _repoName, _tags, false);

            const [found, name, repositoryURI, repositoryTags] = await s.RegistryInstance.getTypeRepositoryByName.call(_orgName, _repoName);

            return {receipt: removeResult.receipt, view: {found, name, repositoryURI, repositoryTags}};
        };

        // helpers for local data store

        const deleteAllLocalTagsForService = (_serviceName) => {
            s.Data.TagsToServices.forEach((v, k) => v.delete(_serviceName));
        };

        const deleteAllLocalTagsForRepo = (_repoName) => s.Data.TagsToRepos.forEach((v, k) => v.delete(_repoName));

        const updateLocalServiceTagData = (_orgName, _serviceName, _tags, _add) => {

            if (_add) {
                _tags.forEach(t => {
                    s.Data.ServiceTags.add(t);
                    s.Data.TagsToServices.getOrCreateSet(t).add(_serviceName);
                });
            } else {
                _tags.forEach(t => {
                    s.Data.TagsToServices.getOrCreateSet(t).delete(_serviceName);
                })
            }
        };

        const updateLocalRepoTagData = (_orgName, _repoName, _tags, _add) => {

            if (_add) {
                _tags.forEach(t => {
                    s.Data.RepoTags.add(t);
                    s.Data.TagsToRepos.getOrCreateSet(t).add(_repoName);
                });
            } else {
                _tags.forEach(t => {
                    s.Data.TagsToRepos.getOrCreateSet(t).delete(_repoName);
                });
            }
        };

        /**
         * Asserts that the smart contract state matches the in-memory state
         */
        const validateAllTheThings = async (
            /* Set<String>              */ _orgNames, _serviceTags, _repoTags,
            /* Map<String, Set<String>> */ _orgsToServices, _orgsToRepos, _tagsToServices, _tagsToRepos) => {

            // validate top level orgs and tags
            const orgNames = (await s.RegistryInstance.listOrganizations.call()).map(bytesToString);
            assertArraysEqual(assert.equal, [..._orgNames], orgNames, "listOrganizations returned unexpected org names");

            const serviceTags = (await s.RegistryInstance.listServiceTags.call()).map(bytesToString);
            assertArraysEqual(assert.equal, [..._serviceTags], serviceTags, "listServiceTags returned unexpected service tags");

            const repoTags = (await s.RegistryInstance.listTypeRepositoryTags.call()).map(bytesToString);
            assertArraysEqual(assert.equal, [..._repoTags], repoTags, "listTypeRepositoryTags returned unexpected repo tags");

            // validate org->service mappings
            await _orgsToServices.forEachAsync(async (orgName, services) => {

                const [found, serviceNames] = await s.RegistryInstance.listServicesForOrganization.call(orgName);

                const serviceNamesDecoded = serviceNames.map(bytesToString);

                assertArraysEqual(assert.equal, [...services], serviceNamesDecoded
                    , "listServicesForOrganization returned unexpected services for org " + orgName);
            });

            // validate org->repo mappings
            await _orgsToRepos.forEachAsync(async (orgName, repos) => {

                const [found, repoNames] = await s.RegistryInstance.listTypeRepositoriesForOrganization.call(orgName);

                const repoNamesDecoded = repoNames.map(bytesToString);

                assertArraysEqual(assert.equal, [...repos], repoNamesDecoded
                    , "listTypeRepositoriesForOrganization returned unexpected repos for org " + orgName);
            });

            // validate tag->service mappings
            await _tagsToServices.forEachAsync(async (tagName, services) => {

                const [orgNames, serviceNames] = await s.RegistryInstance.listServicesForTag.call(tagName);

                const orgNamesDecoded = orgNames.map(bytesToString); // TODO: actually validate the org names
                const serviceNamesDecoded = serviceNames.map(bytesToString);

                assertArraysEqual(assert.equal, [...services], serviceNamesDecoded
                    , "listServicesForTag returned unexpected services for tag " + tagName);
            });

            // validate tag->repo mappings
            await _tagsToRepos.forEachAsync(async (tagName, repos) => {

                const [orgNames, repoNames] = await s.RegistryInstance.listTypeRepositoriesForTag.call(tagName);

                const orgNamesDecoded = orgNames.map(bytesToString); // TODO: actually validate the org names
                const repoNamesDecoded = repoNames.map(bytesToString);

                assertArraysEqual(assert.equal, [...repos], repoNamesDecoded
                    , "listTypeRepositoriesForTag returned unexpected repos for tag " + tagName);
            });
        };


        const testLogic = async (numOrgs, servicesPerOrg, reposPerOrg, numTags) => {
            // create numOrgs orgs
            for (let i = 0; i < numOrgs; i++) {
                // setup params
                const orgName = c.Format.getOrgName(i);
                const membersArray = intRange(0, i+1).map(c.Format.getMemberAddress);

                it(`Creates org ${orgName} with ${membersArray.length} members`, async () => {
                    // interact with contract
                    const createResult = await createOrganization(orgName, membersArray);

                    // validate receipt
                    assert.equal(TX_STATUS.SUCCESS, parseInt(createResult.receipt.status)
                        , `createOrganization tx should succeed for ${orgName}`);


                    // destructure view
                    const {found, name, owner, members, serviceNames, repositoryNames} = createResult.view;
                    const membersDecoded = members.map(m => addressToString(m));

                    // validate view
                    assert.equal(true, found, "Org not found after registration");
                    assert.equal(orgName, bytesToString(name), "Org registered with the wrong name");
                    assert.equal(c.CreatorAccount, addressToString(owner), "Org registered with the wrong owner");
                    assertArraysEqual(assert.equal, membersArray, membersDecoded, "Org registered with incorrect members");
                    assert.equal(0, serviceNames.length, "Org registered with pre-existing services");
                    assert.equal(0, repositoryNames.length, "Org registered with pre-existing type repos");
                });
            }

            // create servicesPerOrg services per org, with tags/2 tags per service
            const serviceTagsFirstHalf = intRange(0, Math.floor(numTags / 2)).map(c.Format.getServiceTagName);
            for (let i = 0; i < numOrgs; i++) {
                for (let j = 0; j < servicesPerOrg; j++) {
                    const orgName = c.Format.getOrgName(i);
                    const serviceName = c.Format.getServiceName(orgName, j);
                    const metadataURI = c.Format.getMetaUri(orgName, j);

                    it(`Creates a service ${serviceName} for org ${orgName} with ${serviceTagsFirstHalf.length} tags`, async () => {
                        // interact with contract
                        const createResult = await createService(orgName, serviceName, metadataURI, serviceTagsFirstHalf);

                        // validate receipt
                        assert.equal(TX_STATUS.SUCCESS, parseInt(createResult.receipt.status), `createService tx should succeed for ${serviceName}`);

                        // destructure view
                        const {found: found, name: viewServiceName, metadataURI: viewMetadataURI, serviceTags: viewServiceTags} = createResult.view;
                        
                        const viewServiceTagsDecoded = viewServiceTags.map(bytesToString);

                        // validate view
                        assert.equal(true, found, "Service not found after registration");
                        assert.equal(serviceName, bytesToString(viewServiceName), "Service registered with the wrong name");
                        assert.equal(metadataURI, bytesToString(viewMetadataURI),  "Service registered with the wrong uri");
                        assertArraysEqual(assert.equal, serviceTagsFirstHalf, viewServiceTagsDecoded, "Service registered with incorrect tags");
                    });
                }
            }

            // create reposPerOrg type repositories per org, with tags/2 tags per repo
            const repoTagsFirstHalf = intRange(0, Math.floor(numTags / 2)).map(c.Format.getRepoTagName);
            for (let i = 0; i < numOrgs; i++) {
                for (let j = 0; j < reposPerOrg; j++) {
                    const orgName = c.Format.getOrgName(i);
                    const repoName = c.Format.getRepoName(orgName, j);
                    const repoUri = c.Format.getRepoUri(orgName, j);

                    it(`Creates a type repository ${repoName} for org ${orgName} with ${repoTagsFirstHalf.length} tags`, async () => {
                        // interact with contract
                        const createResult = await createTypeRepository(orgName, repoName, repoUri, repoTagsFirstHalf);

                        // validate receipt
                        assert.equal(TX_STATUS.SUCCESS, parseInt(createResult.receipt.status), `createTypeRepository tx should succeed for ${repoName}`);

                        // destructure view
                        const {found: found, name: viewRepoName, repositoryURI: viewRepoUri, repositoryTags: viewRepoTags} = createResult.view;
                        const viewRepoTagsDecoded = viewRepoTags.map(bytesToString);

                        // validate view
                        assert.equal(true, found, "Repo not found after registration");
                        assert.equal(repoName, bytesToString(viewRepoName), "Repo registered with the wrong name");
                        assert.equal(repoUri, bytesToString(viewRepoUri), "Repo registered with the wrong URI");
                        assertArraysEqual(assert.equal, repoTagsFirstHalf, viewRepoTagsDecoded, "Repo registered with incorrect tags");
                    });
                }
            }


            // VALIDATE ALL THE THINGS

            it(`VALIDATE ALL THE THINGS!`, async () => await validateAllTheThings(s.Data.Orgs, s.Data.ServiceTags, s.Data.RepoTags, s.Data.OrgsToServices, s.Data.OrgsToRepos, s.Data.TagsToServices, s.Data.TagsToRepos));


            // add tags/2 tags to each service and repo
            const serviceTagsSecondHalf = numTags === 0 ? [] : intRange(Math.floor(numTags / 2) + 1, numTags).map(c.Format.getServiceTagName);
            if (numTags !== 0) {
                for (let i = 0; i < numOrgs; i++) {
                    for (let j = 0; j < servicesPerOrg; j++) {
                        const orgName = c.Format.getOrgName(i);
                        const serviceName = c.Format.getServiceName(orgName, j);
                        const metadataURI = c.Format.getMetaUri(orgName, j);

                        it(`Adds ${serviceTagsSecondHalf.length} more tags to ${serviceName}`, async () => {

                            const addResult = await addTagsToService(orgName, serviceName, serviceTagsSecondHalf)

                            assert.equal(TX_STATUS.SUCCESS, parseInt(addResult.receipt.status), `addTagsToService should succeed for ${serviceName} with ${serviceTagsSecondHalf.length} tags`);

                            // destructure view
                            const {found: found, name: viewServiceName, metadataURI: viewMetadataURI, serviceTags: viewServiceTags} = addResult.view;
                            const viewServiceTagsDecoded = viewServiceTags.map(bytesToString);
                            const expectedServiceTags = [...serviceTagsFirstHalf, ...serviceTagsSecondHalf];


                            // validate view
                            assert.equal(true, found, "Service not found after adding tags");
                            assert.equal(serviceName, bytesToString(viewServiceName), "Service name doesnt match after adding tags");
                            assert.equal(metadataURI, bytesToString(viewMetadataURI), "Service metadataURI doesnt match after adding tags");
                            assertArraysEqual(assert.equal, expectedServiceTags, viewServiceTagsDecoded, "Service registered with incorrect tags");
                        });
                    }
                }
            }

            const repoTagsSecondHalf = numTags === 0 ? [] : intRange(Math.floor(numTags / 2) + 1, numTags).map(c.Format.getRepoTagName);
            if (numTags !== 0) {
                for (let i = 0; i < numOrgs; i++) {
                    for (let j = 0; j < reposPerOrg; j++) {
                        const orgName = c.Format.getOrgName(i);
                        const repoName = c.Format.getRepoName(orgName, j);
                        const repoUri = c.Format.getRepoUri(orgName, j);

                        it(`Adds ${repoTagsSecondHalf.length} more tags to ${repoName}`, async () => {
                            // interact with contract
                            const addResult = await addTagsToRepo(orgName, repoName, repoTagsSecondHalf);

                            // validate receipt
                            assert.equal(TX_STATUS.SUCCESS, parseInt(addResult.receipt.status), `addTagsToRepo should succeed for ${repoName}`);

                            // destructure view
                            const {found: found, name: viewRepoName, repositoryURI: viewRepoUri, repositoryTags: viewRepoTags} = addResult.view;
                            const viewRepoTagsDecoded = viewRepoTags.map(bytesToString);
                            const expectedRepoTags = [...repoTagsFirstHalf, ...repoTagsSecondHalf];

                            // validate view
                            assert.equal(true, found, "Repo not found after registration");
                            assert.equal(repoName, bytesToString(viewRepoName), "Repo registered with the wrong name");
                            assert.equal(repoUri, bytesToString(viewRepoUri), "Repo registered with the wrong URI");
                            assertArraysEqual(assert.equal, expectedRepoTags, viewRepoTagsDecoded, "Repo registered with incorrect tags");
                        });
                    }
                }
            }


            it(`VALIDATE - after adding second half tags`, async () =>
                await validateAllTheThings(s.Data.Orgs, s.Data.ServiceTags, s.Data.RepoTags, s.Data.OrgsToServices, s.Data.OrgsToRepos, s.Data.TagsToServices, s.Data.TagsToRepos));

            // delete the first, middle, last service
            let remainingServiceIndexes = [];
            for (let i = 0; i < numOrgs; i++) {
                const orgName = c.Format.getOrgName(i);

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
                    const serviceName = c.Format.getServiceName(orgName, serviceIndex);

                    it(`Deletes ${serviceName} from ${orgName}`, async () => {

                        const deleteResult = await deleteService(orgName, serviceName);

                        assert.equal(TX_STATUS.SUCCESS, parseInt(deleteResult.receipt.status), `deleteService should succeed for ${serviceName}`);

                        const {found: found, name: viewServiceName, serviceTags: viewServiceTags} = deleteResult.view;
                        assert.equal(false, found, "Service was still found after deletion");
                    });
                });

                remainingServiceIndexes = intRange(0, servicesPerOrg).difference(serviceIndexesToDelete);
            }

            it(`VALIDATE - after deleting services`, async () =>
                await validateAllTheThings(s.Data.Orgs, s.Data.ServiceTags, s.Data.RepoTags, s.Data.OrgsToServices, s.Data.OrgsToRepos, s.Data.TagsToServices, s.Data.TagsToRepos));

            // delete the first, middle, last repo
            let remainingRepoIndexes = [];
            for (let i = 0; i < numOrgs; i++) {
                const orgName = c.Format.getOrgName(i);

                let repoIndexesToDelete = [];

                if (reposPerOrg > 0) {
                    repoIndexesToDelete.push(0); // delete the first repo
                }

                if (reposPerOrg > 1) {
                    repoIndexesToDelete.push(reposPerOrg - 1); // delete the last repo
                }

                if (reposPerOrg > 2) {
                    repoIndexesToDelete.push(Math.floor(reposPerOrg / 2)); // delete a middle repo
                }

                repoIndexesToDelete.forEach(repoIndex => {
                    const repoName = c.Format.getRepoName(orgName, repoIndex);

                    it(`Deletes ${repoName} from ${orgName}`, async () => {
                        const deleteResult = await deleteRepo(orgName, repoName);

                        assert.equal(TX_STATUS.SUCCESS, parseInt(deleteResult.receipt.status), `deleteRepo should succeed for ${repoName}`);

                        const {found: found, name: viewRepoName, repositoryURI: viewRepoUri, repositoryTags: viewRepoTags} = deleteResult.view;

                        assert.equal(false, found, "Repo was still found after deletion");
                    });
                });

                remainingRepoIndexes = intRange(0, reposPerOrg).difference(repoIndexesToDelete);
            }

            it(`VALIDATE - after deleting repos`, async () => {
                await validateAllTheThings(s.Data.Orgs, s.Data.ServiceTags, s.Data.RepoTags, s.Data.OrgsToServices, s.Data.OrgsToRepos, s.Data.TagsToServices, s.Data.TagsToRepos)
            });

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
                    const orgName = c.Format.getOrgName(orgIndex);

                    it(`Deletes org ${orgName} with ${numTags} tags`, async () => {

                        const deleteResult = await deleteOrganization(orgName);

                        assert.equal(TX_STATUS.SUCCESS, parseInt(deleteResult.receipt.status), `deleteOrg should succeed for ${orgName}`);

                        // destructure view
                        const {found, name, owner, serviceNames, repositoryNames} = deleteResult.view;

                        // validate view
                        assert.equal(false, found, "Org still found after deletion");
                    });
                });

                remainingOrgIndexes = intRange(0, numOrgs).difference(orgIndexesToDelete);
            }

            it(`VALIDATE - after deleting orgs`, async () => {
                await validateAllTheThings(s.Data.Orgs, s.Data.ServiceTags, s.Data.RepoTags, s.Data.OrgsToServices, s.Data.OrgsToRepos, s.Data.TagsToServices, s.Data.TagsToRepos)
            });


            // delete tags/4 tags from each service and repo

            if (numTags !== 0) {
                const allServiceTags = [...serviceTagsFirstHalf, ...serviceTagsSecondHalf];
                const serviceTagsToRemove = [...serviceTagsFirstHalf, ...serviceTagsSecondHalf].filter((e, i) => i % 4 === 3);
                const expectedServiceTags = [...serviceTagsFirstHalf, ...serviceTagsSecondHalf].filter((e, i) => [0, 1, 2].includes(i % 4));
                for (const i of remainingOrgIndexes) {
                    for (const j of remainingServiceIndexes) {
                        const orgName = c.Format.getOrgName(i);
                        const serviceName = c.Format.getServiceName(orgName, j);
                        const metadataURI = c.Format.getMetaUri(orgName, j);

                        it(`Removes ${serviceTagsToRemove.length} tags from ${serviceName}`, async () => {
                            const removeResult = await removeTagsFromService(orgName, serviceName, serviceTagsToRemove);

                            assert.equal(TX_STATUS.SUCCESS, parseInt(removeResult.receipt.status), `removeResult should succeed for ${serviceName} with ${serviceTagsToRemove.length} tags`);

                            const {found: found, name: viewServiceName, metadataURI: viewMetadataURI, serviceTags: viewServiceTags} = removeResult.view;
                            const viewServiceTagsDecoded = viewServiceTags.map(bytesToString);

                            // validate view
                            assert.equal(true, found, "Service not found after removing tags");
                            assert.equal(serviceName, bytesToString(viewServiceName), "Service name doesnt match after removing tags");
                            assert.equal(metadataURI, bytesToString(viewMetadataURI), "Service metadataURI doesnt match after removing tags");
                            assertArraysEqual(assert.equal, expectedServiceTags, viewServiceTagsDecoded, "Service registered with incorrect tags");
                        });
                    }
                }

                const allRepoTags = [...repoTagsFirstHalf, ...repoTagsSecondHalf];
                const repoTagsToRemove = [...repoTagsFirstHalf, ...repoTagsSecondHalf].filter((e, i) => i % 4 === 3);
                const expectedRepoTags = [...repoTagsFirstHalf, ...repoTagsSecondHalf].filter((e, i) => [0, 1, 2].includes(i % 4));
                for (const i of remainingOrgIndexes) {
                    for (const j of remainingRepoIndexes) {
                        const orgName = c.Format.getOrgName(i);
                        const repoName = c.Format.getRepoName(orgName, j);
                        const repoUri = c.Format.getRepoUri(orgName, j);

                        it(`Removes ${repoTagsToRemove.length} tags from ${repoName}`, async () => {
                            const removeResult = await removeTagsFromRepo(orgName, repoName, repoTagsToRemove);

                            assert.equal(TX_STATUS.SUCCESS, parseInt(removeResult.receipt.status), `removeResult should succeed for ${repoName} with ${repoTagsToRemove.length} tags`);

                            // destructure view
                            const {found: found, name: viewRepoName, repositoryURI: viewRepoUri, repositoryTags: viewRepoTags} = removeResult.view;
                            const viewRepoTagsDecoded = viewRepoTags.map(bytesToString);

                            // validate view
                            assert.equal(true, found, "Repo not found after registration");
                            assert.equal(repoName, bytesToString(viewRepoName), "Repo registered with the wrong name");
                            assert.equal(repoUri, bytesToString(viewRepoUri), "Repo registered with the wrong URI");
                            assertArraysEqual(assert.equal, expectedRepoTags, viewRepoTagsDecoded, "Repo registered with incorrect tags");
                        });
                    }
                }
            }

            it(`VALIDATE - after deleting tags`, async () => {
                await validateAllTheThings(s.Data.Orgs, s.Data.ServiceTags, s.Data.RepoTags, s.Data.OrgsToServices, s.Data.OrgsToRepos, s.Data.TagsToServices, s.Data.TagsToRepos)
            });
        };

        await testLogic(suite_numOrgs, suite_servicesPerOrg, suite_reposPerOrg, suite_numTags) ;
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
