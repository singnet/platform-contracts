**This repository is transitioning in preparation for upcoming changes to the SingularityNET platform. For accurate documentation with respect to SingularityNET Alpha on Kovan, please refer to this [previous commit](https://github.com/singnet/platform-contracts/tree/c1308d82a23249fc9e2ad29aa990fc2eb813c3a3).**

# platform-contracts

[![CircleCI](https://circleci.com/gh/singnet/platform-contracts.svg?style=svg)](https://circleci.com/gh/singnet/platform-contracts)

Includes SingularityNET platform contracts, migrations, tests

## Contracts

### Registry
* Per-network contract that maintains a registration structure including organizations, services, and type repositories. Consumers can query this registry by organization, service name, or tag in order to find AI services to use.

### MultiPartyEscrow
* Contract which support payment channels in SingularityNet.


## Interfaces (npm version 1.0.1) - AGIX Compatible

| Name      | InterfaceID ([ERC-165](https://eips.ethereum.org/EIPS/eip-165)) | Source Code                              |
|-----------|-----------------------------------------------------------------|------------------------------------------|
| IRegistry | 0x3f2242ea                                                      | [IRegistry.sol](contracts/IRegistry.sol) |

## Deployed Contracts (npm version 1.0.1)

* Registry (Mainnet): [0x247DEbEBB766E4fA99667265A158060018D5f4F8](https://etherscan.io/address/0x247DEbEBB766E4fA99667265A158060018D5f4F8)
* Multi Party Escrow (Mainnet): [0x5e592F9b1d303183d963635f895f0f0C48284f4e](https://etherscan.io/address/0x5e592F9b1d303183d963635f895f0f0C48284f4e)
* AGI Token (Mainnet) :  [0x5B7533812759B45C2B44C19e320ba2cD2681b542](https://etherscan.io/address/0x5B7533812759B45C2B44C19e320ba2cD2681b542)

* Registry (Kovan): [0xc254E2c484bfa175EE1E299DfeF6183bC3Fe12Ad](https://kovan.etherscan.io/address/0xc254E2c484bfa175EE1E299DfeF6183bC3Fe12Ad )
* Multi Party Escrow (Kovan): [0x2BfED8c52b43DBb7F0a8201d1d9e478E48656bf5](https://kovan.etherscan.io/address/0x2BfED8c52b43DBb7F0a8201d1d9e478E48656bf5)
* AGI Token (Kovan) :  [0x20802d1a9581b94e51db358C09e0818d6bd071b4](https://kovan.etherscan.io/address/0x20802d1a9581b94e51db358C09e0818d6bd071b4)

* Registry (Ropsten) :  [0xB12089BD3F20A2C546FAad4167A08C57584f89C8](https://ropsten.etherscan.io/address/0xB12089BD3F20A2C546FAad4167A08C57584f89C8)
* Multi Party Escrow (Ropsten) :  [0xFB1EB92D0721f0109bCC3aFd4eBbF0f7F06FCB52](https://ropsten.etherscan.io/address/0xFB1EB92D0721f0109bCC3aFd4eBbF0f7F06FCB52)
* AGI Token (Ropsten) :  [0xA1e841e8F770E5c9507E2f8cfd0aA6f73009715d](https://ropsten.etherscan.io/address/0xA1e841e8F770E5c9507E2f8cfd0aA6f73009715d)



## Interfaces (npm version 0.3.2) - AGI Compatible

| Name      | InterfaceID ([ERC-165](https://eips.ethereum.org/EIPS/eip-165)) | Source Code                              |
|-----------|-----------------------------------------------------------------|------------------------------------------|
| IRegistry | 0x3f2242ea                                                      | [IRegistry.sol](contracts/IRegistry.sol) |

## Deployed Contracts (npm version 0.3.3)

* Registry (Mainnet): [0xdce9c76ccb881af94f7fb4fac94e4acc584fa9a5](https://etherscan.io/address/0xdce9c76ccb881af94f7fb4fac94e4acc584fa9a5)
* Multi Party Escrow (Mainnet): [0x34e2eee197efaabecc495fdf3b1781a3b894eb5f](https://etherscan.io/address/0x34e2eee197efaabecc495fdf3b1781a3b894eb5f)
* AGI Token (Mainnet) :  [0x8eb24319393716668d768dcec29356ae9cffe285](https://etherscan.io/address/0x8eb24319393716668d768dcec29356ae9cffe285)

* Registry (Kovan): [0x89a780619a7b0542b52bbb929bc1ea01516542ec](https://kovan.etherscan.io/address/0x89a780619a7b0542b52bbb929bc1ea01516542ec)
* Multi Party Escrow (Kovan): [0x5e3b04dba48b775fcae65d738b7a75589a42fd3a](https://kovan.etherscan.io/address/0x5e3b04dba48b775fcae65d738b7a75589a42fd3a)
* AGI Token (Kovan) :  [0x3b226fF6AAd7851d3263e53Cb7688d13A07f6E81](https://kovan.etherscan.io/address/0x3b226fF6AAd7851d3263e53Cb7688d13A07f6E81)

* Registry (Ropsten) :  [0x663422c6999ff94933dbcb388623952cf2407f6f](https://ropsten.etherscan.io/address/0x663422c6999ff94933dbcb388623952cf2407f6f)
* Multi Party Escrow (Ropsten) :  [0x8fb1dc8df86b388c7e00689d1ecb533a160b4d0c](https://ropsten.etherscan.io/address/0x8fb1dc8df86b388c7e00689d1ecb533a160b4d0c)
* AGI Token (Ropsten) :  [0xb97E9bBB6fd49865709d3F1576e8506ad640a13B](https://ropsten.etherscan.io/address/0xb97E9bBB6fd49865709d3F1576e8506ad640a13B)


## Interfaces (npm version 0.3.0)

| Name      | InterfaceID ([ERC-165](https://eips.ethereum.org/EIPS/eip-165)) | Source Code                              |
|-----------|-----------------------------------------------------------------|------------------------------------------|
| IRegistry | 0x256b3545                                                      | [IRegistry.sol](contracts/IRegistry.sol) |

## Deployed Contracts (npm version 0.3.0)
* Registry (Mainnet): [0xb3180a92e210b45e3447976a412ac0df859febaf](https://etherscan.io/address/0xb3180a92e210b45e3447976a412ac0df859febaf)
* Multi Party Escrow (Mainnet): [0x9c9252ec9fa844e2c7bd2e6f54bec2901938479f](https://etherscan.io/address/0x9c9252ec9fa844e2c7bd2e6f54bec2901938479f)
* AGI Token (Mainnet) :  [0x8eb24319393716668d768dcec29356ae9cffe285](https://etherscan.io/address/0x8eb24319393716668d768dcec29356ae9cffe285)

* Registry (Kovan): [0xe331bf20044a5b24c1a744abc90c1fd711d2c08d](https://kovan.etherscan.io/address/0xe331bf20044a5b24c1a744abc90c1fd711d2c08d)
* Multi Party Escrow (Kovan): [0x39f31ac7b393fe2c6660b95b878feb16ea8f3156](https://kovan.etherscan.io/address/0x39f31ac7b393fe2c6660b95b878feb16ea8f3156)
* AGI Token (Kovan) :  [0x3b226fF6AAd7851d3263e53Cb7688d13A07f6E81](https://kovan.etherscan.io/address/0x3b226fF6AAd7851d3263e53Cb7688d13A07f6E81)

* Multi Party Escrow (Ropsten) :  [0x7e6366fbe3bdfce3c906667911fc5237cc96bd08](https://ropsten.etherscan.io/address/0x7e6366fbe3bdfce3c906667911fc5237cc96bd08)
* Registry (Ropsten) :  [0x5156fde2ca71da4398f8c76763c41bc9633875e4](https://ropsten.etherscan.io/address/0x5156fde2ca71da4398f8c76763c41bc9633875e4)
* AGI Token (Ropsten) :  [0xb97E9bBB6fd49865709d3F1576e8506ad640a13B](https://ropsten.etherscan.io/address/0xb97E9bBB6fd49865709d3F1576e8506ad640a13B)

## Requirements
* [Node.js](https://github.com/nodejs/node) (v10.11.0)
* [Npm](https://www.npmjs.com/package/npm) (6.4.1)

## Install

### Dependencies
```bash
npm install
```

### Compile 
```bash
npm run-script compile
```

### Test 
```bash
npm run-script test
```

## Package
```bash
npm run package-npm
```

## Release
Contract build artifacts are published to NPM: https://www.npmjs.com/package/singularitynet-platform-contracts
