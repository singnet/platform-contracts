let Registry = artifacts.require("RegistryImpl");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(Registry)
        .then(() => Registry.deployed());
};
