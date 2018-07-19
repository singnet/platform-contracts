"use strict";

let AgentFactory = artifacts.require("AgentFactory");
let Agent = artifacts.require("Agent");
//let Registry = artifacts.require("Registry");
let Job = artifacts.require("Job");
let Contract = require("truffle-contract");
let TokenAbi = require("singularitynet-token-contracts/abi/SingularityNetToken.json");
let TokenNetworks = require("singularitynet-token-contracts/networks/SingularityNetToken.json");
let TokenBytecode = require("singularitynet-token-contracts/bytecode/SingularityNetToken.json");
let Token = Contract({contractName: "SingularityNetToken", abi: TokenAbi, networks: TokenNetworks, bytecode: TokenBytecode});
let { STRINGS, AGENT_STATE, JOB_STATE, HELPERS : { signAddress, bytesToString, addressToString }} = require("./util/Util.js");

Token.setProvider(web3.currentProvider);

// use triple equals for all equality and inequality checks
assert.equal    = assert.strictEqual;
assert.notEqual = assert.notStrictEqual;

contract("Agent Creation & Job Execution", async (accounts) => {
    const testConstants = Object.freeze({
        CreatorAccount    : accounts[1], // creator of agent
        ConsumerAccount   : accounts[0], // consumer of agent
        AgentName         : "Mr. Smith", // name of the agent
        AgentPrice        : 8          , // price that agent demands for services
        AgentUrl          : "http://fake.url", // agent's hosted service url
        AgentMetadataUri  : "/ipfs/whatever", // agent's IPFS-hosted metadata uri

        AgentUrl2         : "http://new.fake.url", // agent's hosted service url
        AgentMetadataUri2 : "/ipfs/whateverElse" // agent's IPFS-hosted metadata uri
    });

    const testState = Object.seal({
        // blockchain info
        TokenAddress         : null,
        AgentFactoryInstance : null,
        TokenInstance        : null,
        AgentInstance        : null,
        JobInstance          : null,
        // signature outputs
        Signature : {
            v: null,
            r: null,
            s: null
        }
    });

    before(async () => {
        testState.AgentFactoryInstance = await AgentFactory.deployed();
        testState.TokenAddress         = await testState.AgentFactoryInstance.token.call();

        testState.TokenInstance = Token.at(testState.TokenAddress);
    });

    it(`Creates agent with owner ${testConstants.CreatorAccount}, price ${testConstants.AgentPrice}, and url ${testConstants.AgentUrl}`, async () => {
        const createAgentResult = await testState.AgentFactoryInstance.createAgent(testConstants.AgentPrice
            , testConstants.AgentUrl, testConstants.AgentMetadataUri, {from: testConstants.CreatorAccount});
        testState.AgentInstance = Agent.at(createAgentResult.logs[0].args.agent);

        const state        = (await testState.AgentInstance.state.call()).toNumber();
        const owner        = await testState.AgentInstance.owner.call();
        const currentPrice = (await testState.AgentInstance.currentPrice.call()).toNumber();
        const endpoint     = await testState.AgentInstance.endpoint.call();
        const metadataUri  = await testState.AgentInstance.metadataURI.call();

        assert.equal(AGENT_STATE.ENABLED           , state       , "Agent state should be ENABLED");
        assert.equal(testConstants.CreatorAccount  , owner       , "Agent's owner was not saved correctly");
        assert.equal(testConstants.AgentPrice      , currentPrice, "Agent price was not saved correctly");
        assert.equal(testConstants.AgentUrl        , endpoint    , "Agent endpoint was not saved correctly");
        assert.equal(testConstants.AgentMetadataUri, metadataUri , "Agent metadata uri was not saved correctly");
    });

    it(`Creates job with consumer account ${testConstants.ConsumerAccount}`, async () => {
        const createJobResult = await testState.AgentInstance.createJob({from: testConstants.ConsumerAccount});
        testState.JobInstance = Job.at(createJobResult.logs[0].args.job);

        const jobPrice = (await testState.JobInstance.jobPrice.call()).toNumber();
        const consumer = await testState.JobInstance.consumer.call();
        const agent    = await testState.JobInstance.agent.call();
        const state    = (await testState.JobInstance.state.call()).toNumber();

        assert.equal(testConstants.AgentPrice       , jobPrice, "Job price was not copied correctly from the AgentInstance");
        assert.equal(testConstants.ConsumerAccount  , consumer, "Job consumer was not saved correctly");
        assert.equal(testState.AgentInstance.address, agent   , "Agent address is mismatched between JobInstance and AgentInstance");
        assert.equal(JOB_STATE.PENDING              , state   , "Job state should be PENDING");
    });

    it(`Approves ${testConstants.AgentPrice} AGI transfer to job from consumer ${testConstants.ConsumerAccount}`, async () => {
        await testState.TokenInstance.approve(testState.JobInstance.address, testConstants.AgentPrice, {from: testConstants.ConsumerAccount});
        const balance       = (await testState.TokenInstance.balanceOf.call(testState.JobInstance.address)).toNumber();
        const state         = (await testState.JobInstance.state.call()).toNumber();

        assert.equal(0                , balance, "Job should not have AGI balance yet");
        assert.equal(JOB_STATE.PENDING, state  , "Job state should be PENDING");
    });

    it(`Funds job by consumer ${testConstants.ConsumerAccount} with ${testConstants.AgentPrice} AGI`, async () => {
        const fundJobResult = await testState.JobInstance.fundJob({from: testConstants.ConsumerAccount});
        const balance       = (await testState.TokenInstance.balanceOf.call(testState.JobInstance.address)).toNumber();
        const state         = (await testState.JobInstance.state.call()).toNumber();

        assert.equal(testConstants.AgentPrice, balance, `Job was not funded with ${testConstants.AgentPrice} AGI`);
        assert.equal(JOB_STATE.FUNDED        , state  , "Job state should be FUNDED");
    });

    it(`Signs job address by consumer ${testConstants.ConsumerAccount} and validate signature by owner ${testConstants.CreatorAccount}`, async () => {
        [testState.Signature.v, testState.Signature.r, testState.Signature.s] = signAddress(testState.JobInstance.address, testConstants.ConsumerAccount);

        const validated = await testState.AgentInstance.validateJobInvocation(testState.JobInstance.address
            , testState.Signature.v, testState.Signature.r, testState.Signature.s);
        assert.equal(true, validated, "Signature should be validated");
    });

    it(`Completes job by owner ${testConstants.CreatorAccount} and checks contract states`, async () => {
        // complete the job
        await testState.AgentInstance.completeJob(testState.JobInstance.address
            , testState.Signature.v, testState.Signature.r, testState.Signature.s
            , {from: testConstants.CreatorAccount});

        // verify Job-side state
        const jobPrice    = (await testState.JobInstance.jobPrice.call()).toNumber();
        const jobConsumer = await testState.JobInstance.consumer.call();
        const jobAgent    = await testState.JobInstance.agent.call();
        const jobState    = (await testState.JobInstance.state.call()).toNumber();

        assert.equal(testConstants.AgentPrice       , jobPrice   , "Job price was changed");
        assert.equal(testConstants.ConsumerAccount  , jobConsumer, "Job consumer account was changed");
        assert.equal(testState.AgentInstance.address, jobAgent   , "Job's reference to AgentInstance was changed");
        assert.equal(JOB_STATE.COMPLETED            , jobState   , "Job should be in COMPLETED state");

        // verify Agent-side state
        const agentOwner        = await testState.AgentInstance.owner.call();
        const agentPrice        = (await testState.AgentInstance.currentPrice.call()).toNumber();
        const agentOwnerBalance = (await testState.TokenInstance.balanceOf.call(agentOwner)).toNumber();

        assert.equal(testConstants.CreatorAccount, agentOwner       , "Agent owner was changed");
        assert.equal(testConstants.AgentPrice    , agentPrice       , "AgentPrice was changed");
        assert.equal(testConstants.AgentPrice    , agentOwnerBalance, `Agent owner does not have ${testConstants.AgentPrice} AGI`);
    });

    it(`Changes the agent endpoint to ${testConstants.AgentUrl2}`, async () => {
        const setEndpointResult = await testState.AgentInstance.setEndpoint.sendTransaction(testConstants.AgentUrl2, {from: accounts[1]});

        const updatedEndpoint = await testState.AgentInstance.endpoint.call();

        assert.equal(updatedEndpoint, testConstants.AgentUrl2);
    });

    it(`Changes the agent metadata uri to ${testConstants.AgentMetadataUri2}`, async () => {
        const setMetadataUriResult = await testState.AgentInstance.setMetadataURI.sendTransaction(testConstants.AgentMetadataUri2, {from: accounts[1]});

        const updatedMetadataUri = await testState.AgentInstance.metadataURI.call();

        assert.equal(updatedMetadataUri, testConstants.AgentMetadataUri2);
    });
});
