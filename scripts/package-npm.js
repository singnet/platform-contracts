"use-strict";

const fse = require("fs-extra");
const path = require("path");
const npmModulePath = "build/npm-module";
const packageJson = "package.json";

// source dir relative to repo root => dest dir relative to module root
const mapDirs = {
};

// source file relative to repo root => dest file relative to module root
//                                or => key to extract from source file => dest file relative to module root
const mapFiles = {
    "contracts/IRegistry.sol": "sol/IRegistry.sol",
    "contracts/Registry.sol":  "sol/Registry.sol",
    "build/contracts/Registry.json": {
        "abi": "abi/Registry.json",
        "networks": "networks/Registry.json",
        "bytecode": "bytecode/Registry.json"
    },
    "build/contracts/MultiPartyEscrow.json": {
        "abi": "abi/MultiPartyEscrow.json",
        "networks": "networks/MultiPartyEscrow.json",
        "bytecode": "bytecode/MultiPartyEscrow.json"
    },
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
            "openzeppelin-solidity": x.dependencies["openzeppelin-solidity"]
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
    if (mapFiles[sourceFile] !== null && typeof mapFiles[sourceFile] === "object") {
        for (key in mapFiles[sourceFile]) {
            let destFile = path.join(npmModulePath, mapFiles[sourceFile][key]);
            let destParent = path.resolve(destFile, "../");
            fse.mkdirsSync(destParent);
            fse.writeJsonSync(destFile, fse.readJsonSync(sourceFile)[key]);
        }
    } else {
        let destFile = path.join(npmModulePath, mapFiles[sourceFile]);
        let destParent = path.resolve(destFile, "../");
        fse.mkdirsSync(destParent);
        fse.copySync(sourceFile, destFile);
    }
}

let packageJsonIn = fse.readJsonSync(packageJson);
fse.writeJsonSync(path.join(npmModulePath, packageJson), transformPackageJson(packageJsonIn), {spaces: 4});
