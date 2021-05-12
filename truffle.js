let HDWalletProvider = require("@truffle/hdwallet-provider");
let Web3 = require("web3");

let provider = (endpoint) => {
    
    if (process.env.HDWALLET_MNEMONIC) {
        return new HDWalletProvider(process.env.HDWALLET_MNEMONIC, endpoint);
    } else {
        return new Web3.providers.HttpProvider(endpoint);
    }
}

let truffleOptions = {
    networks: {
        local: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*" // Any network ID
        },
        develop : {
            host: "127.0.0.1",
            port: 9545,
            network_id: "*",
        },
        localhd: {
            provider: () => provider("http://127.0.0.1:8545"),
            network_id: "*" // Any network ID
        },
        kovan: {
            gasPrice: 50000000000,
            provider: () => provider("https://kovan.infura.io/v3/" + process.env.InfuraKey),
            network_id: "42" // Kovan network ID
        },
        ropsten: {
             gasPrice: 50000000000,
             provider: () => provider("https://ropsten.infura.io/v3/" + process.env.InfuraKey),
            network_id: "3", // ropsten network ID, 
        },
        main: {
            gasPrice: 70000000000,
            provider: () => provider("https://mainnet.infura.io/v3/" + process.env.InfuraKey),
            network_id: "1" // mainnet network ID
       },
    },
    mocha: {
        reporter: 'eth-gas-reporter',
        reporterOptions : {
            currency: 'USD',
            onlyCalledMethods: 'true',
            showTimeSpent: 'true'
        }
    },
    // Configure your compilers
    compilers: {
        solc: {
        version: "0.6.2",    // Fetch exact version from solc-bin (default: truffle's version)
        // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
        settings: {          // See the solidity docs for advice about optimization and evmVersion
            optimizer: {
            enabled: true,
            //runs: 200
            },
            //evmVersion: "byzantium"
        }
        },
    },
    // solc: {
    //     optimizer: {
    //         enabled: true,
    //         runs: 200
    //     }
    // }
};

let reporterArg = process.argv.indexOf('--reporter');
if (reporterArg >= 0) {
    truffleOptions['mocha'] = {
        reporter: process.argv[reporterArg + 1]
    };
}

module.exports = truffleOptions;
