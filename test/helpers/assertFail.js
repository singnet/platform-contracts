module.exports = async function assertFail(callback, message) {
  let web3ErrorThrown = false
  try {
    await callback()
  } catch (error) {
    if (error.message.search('invalid opcode')) web3ErrorThrown = true
  }
  assert.ok(web3ErrorThrown, message || 'Transaction should fail')
}
