**This repository is transitioning in preparation for upcoming changes to the SingularityNET platform. For accurate documentation with respect to SingularityNET Alpha on Kovan, please refer to this [previous commit](https://github.com/singnet/platform-contracts/tree/c1308d82a23249fc9e2ad29aa990fc2eb813c3a3).**

# platform-contracts

[![CircleCI](https://circleci.com/gh/singnet/platform-contracts.svg?style=svg)](https://circleci.com/gh/singnet/platform-contracts)

Includes SingularityNET platform contracts, migrations, tests

## Contracts

### Registry
* Per-network contract that maintains a registration structure including organizations, services, and type repositories. Consumers can query this registry by organization, service name, or tag in order to find AI services to use.

### MultiPartyEscrow
* Contract which support payment channels in SingularityNet.

## Interfaces

| Name      | InterfaceID ([ERC-165](https://eips.ethereum.org/EIPS/eip-165)) | Source Code                              |
|-----------|-----------------------------------------------------------------|------------------------------------------|
| IRegistry | 0x256b3545                                                      | [IRegistry.sol](contracts/IRegistry.sol) |

## Deployed Contracts
* Registry (Kovan): [0xe331bf20044a5b24c1a744abc90c1fd711d2c08d](https://kovan.etherscan.io/address/0xe331bf20044a5b24c1a744abc90c1fd711d2c08d)
* Multi Party Escrow (Kovan): [0x39f31ac7b393fe2c6660b95b878feb16ea8f3156](https://kovan.etherscan.io/address/0x39f31ac7b393fe2c6660b95b878feb16ea8f3156)
* AGI Token (Kovan) :  [0x3b226fF6AAd7851d3263e53Cb7688d13A07f6E81](https://kovan.etherscan.io/address/0x3b226fF6AAd7851d3263e53Cb7688d13A07f6E81)

## Requirements
* [Node.js](https://github.com/nodejs/node) (8+)
* [Npm](https://www.npmjs.com/package/npm)

## Install

### Dependencies
```bash
npm install
```

### Test 
```bash
npm run test
```

## Package
```bash
npm run package-npm
```

## Release
Contract build artifacts are published to NPM: https://www.npmjs.com/package/singularitynet-platform-contracts
