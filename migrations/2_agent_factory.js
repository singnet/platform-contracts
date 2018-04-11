let AgentFactory = artifacts.require("AgentFactory");
let Contract = require("truffle-contract");
let TokenJson = require("singularitynet-token-contracts/SingularityNetToken.json");
let Token = Contract(TokenJson);

module.exports = function(deployer, network, accounts) {
    Token.setProvider(web3.currentProvider);
    Token.defaults({from: accounts[0], gas: 4000000});
    deployer.deploy(Token, {overwrite: false})
        .then(() => Token.deployed())
        .then(() => deployer.deploy(AgentFactory, Token.address))
        .then(() => AgentFactory.deployed());
};
