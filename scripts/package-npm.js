"use-strict";

const fse = require("fs-extra");
const path = require("path");
const npmModulePath = "build/npm-module";
const packageJson = "package.json";

// relative to repo root => relative to module root
const mapDirs = {
};

// relative to repo root => relative to module root
const mapFiles = {
    "contracts/AgentFactory.sol": "AgentFactory.sol",
    "contracts/Registry.sol": "Registry.sol",
    "build/contracts/AgentFactory.json": "AgentFactory.json",
    "build/contracts/Registry.json": "Registry.json",
    "resources/npm-README.md": "README.md",
    "LICENSE": "LICENSE"
};

let transformPackageJson = (x) => {
    return {
        name: x.name,
        version: x.version,
        description: x.description,
        repository: x.repository,
        author: x.author,
        license: x.license,
        bugs: x.bugs,
        homepage: x.homepage,
        dependencies: {
            "singularitynet-token-contracts": x.dependencies["singularitynet-token-contracts"],
            "zeppelin-solidity": x.dependencies["zeppelin-solidity"]
        }
    };
};

fse.removeSync(npmModulePath);
fse.mkdirsSync(npmModulePath);

for (let sourceDir in mapDirs) {
    let destDir = path.join(npmModulePath, mapDirs[sourceDir]);
    let destParent = path.resolve(destDir, "../");
    fse.mkdirsSync(destParent);
    fse.copySync(sourceDir, destDir);
}

for (let sourceFile in mapFiles) {
    let destFile = path.join(npmModulePath, mapFiles[sourceFile]);
    let destParent = path.resolve(destFile, "../");
    fse.mkdirsSync(destParent);
    fse.copySync(sourceFile, destFile);
}

let packageJsonIn = fse.readJsonSync(packageJson);
fse.writeJsonSync(path.join(npmModulePath, packageJson), transformPackageJson(packageJsonIn), {spaces: 4});
