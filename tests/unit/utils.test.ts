import { describe, expect, it } from '@jest/globals'
import { slugify, calculateDiscount, calculatePlatformFee, calculateSellerEarnings } from '@/lib/utils'

describe('Utility functions', () => {
  describe('slugify', () => {
    it('lowercases and slugs', () => {
      expect(slugify('My Product Title')).toBe('my-product-title')
    })

    it('handles special characters', () => {
      expect(slugify('Products! @ #$%')).toBe('products')
    })
  })

  describe('calculateDiscount', () => {
    it('calculates correct discount percentage', () => {
      expect(calculateDiscount(80, 100)).toBe(20)
    })

    it('returns 0 when no discount', () => {
      expect(calculateDiscount(100, 100)).toBe(0)
      expect(calculateDiscount(120, 100)).toBe(0)
    })
  })

  describe('calculatePlatformFee', () => {
    it('calculates platform fee', () => {
      expect(calculatePlatformFee(100, 10)).toBe(10)
      expect(calculatePlatformFee(250, 10)).toBe(25)
    })
  })

  describe('calculateSellerEarnings', () => {
    it('calculates seller earnings after fees', () => {
      expect(calculateSellerEarnings(100, 10, 0)).toBe(90)
      expect(calculateSellerEarnings(100, 10, 5)).toBe(85)
    })
  })
})