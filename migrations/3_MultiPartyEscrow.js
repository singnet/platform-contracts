let MultiPartyEscrow = artifacts.require("./MultiPartyEscrow.sol");
let Contract = require("@truffle/contract");
let TokenAbi = require("singularitynet-token-contracts/abi/SingularityNetToken.json");
let TokenNetworks = require("singularitynet-token-contracts/networks/SingularityNetToken.json");
let TokenBytecode = require("singularitynet-token-contracts/bytecode/SingularityNetToken.json");
let Token = Contract({contractName: "SingularityNet Token", abi: TokenAbi, networks: TokenNetworks, bytecode: TokenBytecode});

// Token Contract Constants
const name = "SingularityNET Token"
const symbol = "AGIX"

module.exports = function(deployer, network, accounts) {
    Token.setProvider(web3.currentProvider)
    Token.defaults({from: accounts[0], gas: 4000000});

    // AGI-I Contract deployment -- Will be deleted once AGI-2 is deployed - Kept it for compatibility only
    //deployer.deploy(Token, {overwrite: false, gas: 4000000}).then((TokenInstance) => deployer.deploy(MultiPartyEscrow, TokenInstance.address));

    // AGI-II Contract deployment 
    deployer.deploy(Token, name, symbol, {overwrite: false, gas: 4000000}).then((TokenInstance) => deployer.deploy(MultiPartyEscrow, TokenInstance.address));
};
