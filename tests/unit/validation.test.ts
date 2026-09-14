import { describe, expect, it } from '@jest/globals'
import { loginSchema, registerSchema, productSchema, checkoutSchema } from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid login', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({ email: 'invalid', password: 'password123' })
      expect(result.success).toBe(false)
    })

    it('rejects short password', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: '123' })
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('accepts valid registration', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password456',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without uppercase', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without number', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Passwordabc',
        confirmPassword: 'Passwordabc',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('productSchema', () => {
    it('accepts valid product', () => {
      const result = productSchema.safeParse({
        title: 'My Product',
        type: 'EBOOK',
        price: 100,
        categoryIds: ['cat1'],
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing title', () => {
      const result = productSchema.safeParse({ type: 'EBOOK', price: 100, categoryIds: ['cat1'] })
      expect(result.success).toBe(false)
    })

    it('rejects empty categories', () => {
      const result = productSchema.safeParse({
        title: 'My Product',
        type: 'EBOOK',
        price: 100,
        categoryIds: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative price', () => {
      const result = productSchema.safeParse({
        title: 'My Product',
        type: 'EBOOK',
        price: -5,
        categoryIds: ['cat1'],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('checkoutSchema', () => {
    it('accepts valid checkout', () => {
      const result = checkoutSchema.safeParse({
        email: 'buyer@example.com',
        name: 'Buyer',
        paymentMethod: 'manual',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = checkoutSchema.safeParse({
        email: 'invalid',
        name: 'Buyer',
        paymentMethod: 'manual',
      })
      expect(result.success).toBe(false)
    })
  })
})