import { describe, expect, it } from '@jest/globals'
import { getPayoutConfig, validatePayoutAccount } from '@/lib/payouts'

describe('Payout account validation', () => {
  it('accepts a valid CCP account with key', () => {
    expect(validatePayoutAccount({ method: 'ccp', holderName: 'أحمد بن يوسف', account: '12345678', key: '90' })).toBeNull()
  })

  it('rejects bad CCP numbers and keys', () => {
    expect(validatePayoutAccount({ method: 'ccp', holderName: 'أحمد بن يوسف', account: '123', key: '90' })).not.toBeNull()
    expect(validatePayoutAccount({ method: 'ccp', holderName: 'أحمد بن يوسف', account: '12345678', key: '' })).not.toBeNull()
    expect(validatePayoutAccount({ method: 'ccp', holderName: 'أحمد بن يوسف', account: '12345678', key: '999' })).not.toBeNull()
  })

  it('accepts a 20-digit RIP and rejects the rest', () => {
    expect(validatePayoutAccount({ method: 'rip', holderName: 'أحمد بن يوسف', account: '00799999001234567890' })).toBeNull()
    expect(validatePayoutAccount({ method: 'rip', holderName: 'أحمد بن يوسف', account: '12345' })).not.toBeNull()
    expect(validatePayoutAccount({ method: 'rip', holderName: 'أحمد بن يوسف', account: '0079999900123456789A' })).not.toBeNull()
  })

  it('accepts Algerian mobile numbers for BaridiMob', () => {
    expect(validatePayoutAccount({ method: 'baridimob', holderName: 'أحمد بن يوسف', account: '0550123456' })).toBeNull()
    expect(validatePayoutAccount({ method: 'baridimob', holderName: 'أحمد بن يوسف', account: '021234567' })).not.toBeNull()
  })

  it('requires a holder name and a known method', () => {
    expect(validatePayoutAccount({ method: 'ccp', holderName: 'ab', account: '12345678', key: '90' })).not.toBeNull()
    expect(validatePayoutAccount({ method: 'western', holderName: 'أحمد بن يوسف', account: '123' })).not.toBeNull()
  })
})

describe('Payout config defaults', () => {
  it('falls back to safe defaults', () => {
    expect(getPayoutConfig({})).toEqual({ minAmount: 1000, holdDays: 7 })
  })

  it('reads configured values and clamps abuse', () => {
    expect(getPayoutConfig({ payout_min_amount: 500, payout_hold_days: 3 })).toEqual({ minAmount: 500, holdDays: 3 })
    expect(getPayoutConfig({ payout_min_amount: -5, payout_hold_days: 500 })).toEqual({ minAmount: 1000, holdDays: 90 })
  })
})
