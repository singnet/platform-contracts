let MultiPartyEscrow = artifacts.require("./MultiPartyEscrow.sol");
let Contract = require("@truffle/contract");
let TokenAbi = require("singularitynet-token-contracts/abi/SingularityNetToken.json");
let TokenNetworks = require("singularitynet-token-contracts/networks/SingularityNetToken.json");
let TokenBytecode = require("singularitynet-token-contracts/bytecode/SingularityNetToken.json");
const tokenName = "SingularityNetToken"
const tokenSymbol = "AGI"
let Token = Contract({
  contractName: tokenName,
  abi: TokenAbi,
  networks: TokenNetworks,
  bytecode: TokenBytecode,
});

module.exports = function (deployer, network, accounts) {
  Token.setProvider(web3.currentProvider);
  Token.defaults({ from: accounts[0], gas: 4000000 });
  deployer
    .deploy(Token, tokenSymbol, tokenSymbol,{ overwrite: false, gas: 4000000 })
    .then((TokenInstance) => deployer.deploy(MultiPartyEscrow, TokenInstance.address));
};
