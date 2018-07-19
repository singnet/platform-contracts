let Registry = artifacts.require("./Registry.sol");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(Registry);
};
