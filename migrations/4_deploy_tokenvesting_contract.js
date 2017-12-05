const TokenVesting = artifacts.require('TokenVesting')
const SingularityNetToken = artifacts.require("token/SingularityNetToken.sol")


module.exports = function (deployer, network, accounts) {
    const beneficiary = accounts[0]
    
      const start = 1450656000
      const cliff = 31536000 // ~1 yr
      const duration = 126144000 // ~4yrs
    
      const amount = 5000 * 1e18
    
      deployer.deploy(TokenVesting,beneficiary,start,cliff,duration,true)
};
