import { describe, expect, it, jest } from '@jest/globals'

jest.mock('@/lib/home-data', () => ({}))

import {
  PLAN_DEFAULT_SETTINGS,
  getCreatorPlanStatus,
  getPromoPlanPrices,
  hasActivePro,
  planDurationForUser,
  planPriceForUser,
  type PlatformSettingsMap,
} from '@/lib/plans'

const baseSettings = (): PlatformSettingsMap => ({ ...PLAN_DEFAULT_SETTINGS })

describe('Plan helpers', () => {
  describe('hasActivePro', () => {
    it('returns false for non-PRO plans', () => {
      expect(hasActivePro('FREE', null)).toBe(false)
      expect(hasActivePro(null, null)).toBe(false)
    })

    it('returns true for PRO without expiry', () => {
      expect(hasActivePro('PRO', null)).toBe(true)
    })

    it('respects expiry dates', () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000)
      expect(hasActivePro('PRO', future)).toBe(true)
      expect(hasActivePro('PRO', past)).toBe(false)
    })
  })

  describe('getCreatorPlanStatus', () => {
    it('defaults to FREE for missing creators', () => {
      expect(getCreatorPlanStatus(null)).toEqual({ plan: 'FREE', isPro: false, daysLeft: 0, active: false })
    })

    it('reports active PRO with days left', () => {
      const planExpiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      const status = getCreatorPlanStatus({ plan: 'PRO', planExpiresAt })
      expect(status.isPro).toBe(true)
      expect(status.plan).toBe('PRO')
      expect(status.daysLeft).toBeGreaterThan(0)
    })
  })

  describe('getPromoPlanPrices', () => {
    it('returns base prices without discount', () => {
      const promo = getPromoPlanPrices(baseSettings())
      expect(promo.active).toBe(false)
      expect(promo.first.price).toBe(300)
      expect(promo.renew.price).toBe(1000)
    })

    it('applies discount to all scopes', () => {
      const settings = baseSettings()
      settings.plan_discount_percent = 20
      const promo = getPromoPlanPrices(settings)
      expect(promo.active).toBe(true)
      expect(promo.first.price).toBe(240)
      expect(promo.renew.price).toBe(800)
    })

    it('respects FIRST-only scope', () => {
      const settings = baseSettings()
      settings.plan_discount_percent = 50
      settings.plan_discount_scope = 'FIRST'
      const promo = getPromoPlanPrices(settings)
      expect(promo.first.price).toBe(150)
      expect(promo.renew.price).toBe(1000)
    })

    it('ignores future-dated promos', () => {
      const settings = baseSettings()
      settings.plan_discount_percent = 50
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      settings.plan_discount_starts_at = tomorrow.toISOString().slice(0, 10)
      const promo = getPromoPlanPrices(settings)
      expect(promo.active).toBe(false)
      expect(promo.first.price).toBe(300)
    })
  })

  describe('planPriceForUser / planDurationForUser', () => {
    it('picks first vs renew prices', () => {
      const settings = baseSettings()
      expect(planPriceForUser(settings, false)).toBe(300)
      expect(planPriceForUser(settings, true)).toBe(1000)
    })

    it('picks first vs renew durations', () => {
      const settings = baseSettings()
      expect(planDurationForUser(settings, false)).toBe(30)
      expect(planDurationForUser(settings, true)).toBe(30)
    })
  })
})
