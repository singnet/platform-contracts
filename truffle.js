const HDWalletProvider = require("truffle-hdwallet-provider")
const mnemonic = "word word word" //MNEMONIC
const host = "http://localhost:8545"//NODE

module.exports = {
  networks: {
    // For accessing a GUI Ethereum test network like Ganache from Linux
    // because localhost is not available in a docker container.
    docker_host: {
      host: "192.168.0.1",
      port: 7545,
      network_id: "*"
    },

    // For accessing a GUI Ethereum test network like Ganache from the
    // Mac because Docker for Mac requires a special way to access the
    // local host because of the VM in which docker containers run.
    docker_host_mac: {
      host: "docker.for.mac.localhost",
      port: 7545,
      network_id: "*"
    },

    // This network will connect to ganache when run outside docker in
    // either the Mac or Linux.
    ganache: {
      host: "localhost",
      port: 7545,
      network_id: "*"
    },

    // Used for test containers launched by docker-compose since 
    // localhost is not available in Docker.
    testrpc: {
      host: "testrpc",
      port: 8545,
      network_id: "*"
    },

    // Connect to the external Kovan Ethereum test network.
    kovan: {
      provider: () => {
        return new HDWalletProvider(mnemonic, host)
      },
      gas: 127000,
      network_id: "42"
    }
  }
}