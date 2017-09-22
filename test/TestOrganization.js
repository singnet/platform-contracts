const Organization = artifacts.require('organization/Organization.sol')

contract('Organization', function() {
  let organization

  beforeEach(async () => {
    organization = await Organization.new()
  })

  it ('verifies that somehow can join an organization', async () => {
    
    let result = await organization.join(0, "0x123")
    assert.isNotNull(result)

  })

  it ('verifies that somehow can quit an organization', async () => {

    let result = await organization.join(0, "0x123")
    let quit = await organization.quit(0)

    assert.isNotNull(quit)

  })

  it ('verifies that an agent can add an invoice', async () => {

    let result = await organization.join(0, "0x123")
    let invoice = await organization.addInvoice(0, 10)

    assert.isNotNull(invoice)

  })
})