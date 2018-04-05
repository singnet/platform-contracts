"use strict";

let AgentFactory = artifacts.require("AgentFactory");
let Agent = artifacts.require("Agent");
let Registry = artifacts.require("Registry");
let Job = artifacts.require("Job");
let Contract = require("truffle-contract");
let TokenJson = require("singularitynet-token-contracts/SingularityNetToken.json");
let Token = Contract(TokenJson);

contract("All", async (accounts) => {
    it("End-to-end", async () => {
        Token.setProvider(web3.currentProvider);
        let agentFactoryInstance = await AgentFactory.deployed();
        let tokenAddress = await agentFactoryInstance.token.call();
        let tokenInstance = Token.at(tokenAddress);

        // Create agent with owner accounts[1] price 8
        let createAgentResult = await agentFactoryInstance.createAgent(8, {from: accounts[1]});
        let agentInstance = Agent.at(createAgentResult.logs[0].args.agent);
        let owner = await agentInstance.owner.call();
        let currentPrice = await agentInstance.currentPrice.call();
        assert.equal(accounts[1], owner);
        assert.equal(8, currentPrice);

        // Register agent with name Agent1
        let registryInstance = await Registry.deployed();
        await registryInstance.registerAgent("Agent1", agentInstance.address, {from: accounts[1]});
        let agents = await registryInstance.listAgents.call();
        assert.equal(1, agents[0].length);

        // Create job with consumer accounts[0]
        let createJobResult = await agentInstance.createJob({from: accounts[0]});
        let jobInstance = Job.at(createJobResult.logs[0].args.job);
        let jobPrice = await jobInstance.jobPrice.call();
        let consumer = await jobInstance.consumer.call();
        let agent = await jobInstance.agent.call();
        let status = await jobInstance.status.call();
        assert.equal(8, jobPrice);
        assert.equal(accounts[0], consumer);
        assert.equal(agentInstance.address, agent);
        assert.equal(0, status);

        // Fund job by consumer accounts[0]
        await tokenInstance.approve(jobInstance.address, 8, {from: accounts[0]});
        let fundJobResult = await jobInstance.fundJob({from: accounts[0]});
        let balance = await tokenInstance.balanceOf.call(jobInstance.address);
        status = await jobInstance.status.call();
        assert.equal(8, balance);
        assert.equal(1, status);

        // Sign job address by consumer accounts[0]
        let [v, r, s] = signAddress(jobInstance.address, accounts[0]);

        // Validate signature by owner accounts[1]
        let validated = await agentInstance.validateJobInvocation(jobInstance.address, v, r, s);
        assert.equal(true, validated);

        // Complete job by owner accounts[1]
        await agentInstance.completeJob(jobInstance.address, v, r, s, {from: accounts[1]});

        // Check all states
        jobPrice = await jobInstance.jobPrice.call();
        consumer = await jobInstance.consumer.call();
        agent = await jobInstance.agent.call();
        status = await jobInstance.status.call();
        assert.equal(8, jobPrice);
        assert.equal(accounts[0], consumer);
        assert.equal(agentInstance.address, agent);
        assert.equal(2, status);

        owner = await agentInstance.owner.call();
        currentPrice = await agentInstance.currentPrice.call();
        assert.equal(accounts[1], owner);
        assert.equal(8, currentPrice);

        balance = await tokenInstance.balanceOf.call(owner);
        assert.equal(8, balance);

        // Disable agent
        await registryInstance.disableAgent("Agent1", {from: accounts[1]});
        agents = await registryInstance.listAgents.call();
        assert.equal(0, agents[1][0]);
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
