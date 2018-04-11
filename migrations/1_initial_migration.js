let Migrations = artifacts.require("Migrations");

module.exports = function(deployer) {
	deployer.deploy(Migrations)
		.then(() => Migrations.deployed());
};
