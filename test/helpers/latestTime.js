// Returns the time of the last mined block in seconds
module.exports = function() {
  return web3.eth.getBlock('latest').timestamp;
}
