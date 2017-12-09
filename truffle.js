const HDWalletProvider = require("truffle-hdwallet-provider")
const mnemonic = "word word word" //MNEMONIC
const host = "http://localhost:8545"//NODE

module.exports = {
  networks: {
    docker_host: {
      host: "192.168.0.1",
      port: 7545,
      network_id: "*"
    },
  networks: {
    docker_host_mac: {
      host: "docker.for.mac.localhost",
      port: 7545,
      network_id: "*"
    },
    ganache: {
      host: "localhost",
      port: 7545,
      network_id: "*"
    },
    testrpc: {
      host: "testrpc",
      port: 8545,
      network_id: "*"
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(mnemonic, host)
      },
      gas: 127000,
      network_id: "42"
    }
  },
}