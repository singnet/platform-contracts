const Factory = artifacts.require('market/TokenVestingFactory.sol')
const { latestTime, duration } = require('./helpers/latestTime')

contract('Token Vesting Factory', function ([owner, beneficiary1, beneficiary2, beneficiary3]) {
  
  let factory

  beforeEach(async () => {
    factory = await Factory.new({ from: owner })
  })
  
  it('verifiy that only the owner can create Vesting contracts', async () => {
    const start = latestTime() + duration.minutes(5),
          cliff = latestTime() + duration.years(1),
          end = latestTime() + duration.years(1)

    try {
      await await factory.create(beneficiary1, start, cliff, end, true, { from: beneficiary1 })
      assert.fail('should have thrown before')
    } catch(error) {
      assert.isAbove(error.message.search('invalid opcode'), -1, error.message)
    }

    await factory.create(beneficiary1, start, cliff, end, true, { from: owner })
  })

  it('verify that multiple Vesting contracts can be created', async () => {
    const start = latestTime() + duration.minutes(5),
          end1 = latestTime() + duration.years(1),
          end2 = latestTime() + duration.days(400),
          end3 = latestTime() + duration.weeks(60),
          cliff1 = latestTime() + duration.years(1),
          cliff2 = latestTime() + duration.days(400),
          cliff3 = latestTime() + duration.weeks(60)

    const res1 = await factory.create(beneficiary1, start, cliff1, end1, true, { from: owner })
    const res2 = await factory.create(beneficiary2, start, cliff2, end2, true, { from: owner })
    const res3 = await factory.create(beneficiary3, start, cliff3, end3, true, { from: owner })

    assert.isNotNull(res1.logs[0].args.vesting)
    assert.isNotNull(res2.logs[0].args.vesting)
    assert.isNotNull(res3.logs[0].args.vesting)
  })

})