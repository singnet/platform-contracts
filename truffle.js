module.exports = {
    networks: {
        development: {
            host: "testrpc",
            port: 8545,
            network_id: "*" // Match any network id
        }
    },
    kovan: {
        host: "testrpc",
        port: 8549,
        network_id: "*" // Match any network id
    }
};
