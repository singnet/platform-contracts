let Registry = artifacts.require("Registry");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(Registry)
        .then(() => Registry.deployed());
};
