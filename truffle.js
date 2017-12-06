const HDWalletProvider = require("truffle-hdwallet-provider")
const mnemonic = "word word word" //MNEMONIC
const host = "http://localhost:8545"//NODE

module.exports = {
  networks: {
    kovan: {
      provider: () => {
        return new HDWalletProvider(mnemonic, host)
      },
      gas: 4700000,
      network_id: "*" // Match any network id
    }
  },
}