const HDWalletProvider = require("truffle-hdwallet-provider")
const mnemonic //MNEMONIC
const host //NODE

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(mnemonic, host)
      },
      gas: 4700000,
      network_id: "*" // Match any network id
    }
  },
}