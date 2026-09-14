import { describe, expect, it } from '@jest/globals'
import { bytes } from '@/lib/product-format'

describe('bytes formatter', () => {
  it('formats zero and invalid sizes', () => {
    expect(bytes(0)).toBe('0 بايت')
    expect(bytes(-5)).toBe('0 بايت')
  })

  it('formats bytes', () => {
    expect(bytes(512)).toBe('512 بايت')
  })

  it('formats kilobytes and megabytes', () => {
    expect(bytes(1024)).toBe('1.0 كيلوبايت')
    expect(bytes(1024 * 1024)).toBe('1.0 ميغابايت')
    expect(bytes(1024 * 1024 * 1024)).toBe('1.0 غيغابايت')
  })
})
