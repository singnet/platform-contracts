# alpha-blockchain
Includes alpha blockchain contracts, migrations, tests

## Contracts

### Agent
* Per-service contract that manages the creation of Job instances at the request of consumers.

### AgentFactory
* Per-network contract that manages the creation of Agent instances at the request of service owners.

### Job
* Per-service-invocation contract that performs escrow functionality with release of funds gated on a valid consumer signature.

### Registry
* Per-network contract that maintains a registration structure including organizations, services, and type repositories. Consumers can query this registry by organization, service name, or tag in order to find AI services to use.

## Interfaces

| Name      | InterfaceID ([ERC-165](https://eips.ethereum.org/EIPS/eip-165)) | Source Code                              |
|-----------|-----------------------------------------------------------------|------------------------------------------|
| IRegistry | 0xbd523993                                                      | [IRegistry.sol](contracts/IRegistry.sol) |

## Deployed Contracts
* AgentFactory (Kovan): [0x17c9c45ef8017862cd1628cd39f8ba1a9bc193ae](https://kovan.etherscan.io/address/0x17c9c45ef8017862cd1628cd39f8ba1a9bc193ae)
* Registry (Kovan): [0x6846ed8ad12d7d4b4bc8319994bbc153d1434783](https://kovan.etherscan.io/address/0x6846ed8ad12d7d4b4bc8319994bbc153d1434783)

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
AgentFactory and Registry artifacts are published to NPM: https://www.npmjs.com/package/singularitynet-alpha-blockchain
