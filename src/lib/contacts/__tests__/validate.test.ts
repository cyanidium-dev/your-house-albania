import { describe, expect, it } from 'vitest'
import { isPlausibleEmail, isPlausiblePhone } from '../validate'

describe('contact validation', () => {
  it('accepts real phone formats and rejects junk', () => {
    expect(isPlausiblePhone('+355 69 000 0000')).toBe(true)
    expect(isPlausiblePhone('(069) 123-4567')).toBe(true)
    expect(isPlausiblePhone('+48 600 123 456')).toBe(true)
    expect(isPlausiblePhone('abc')).toBe(false)
    expect(isPlausiblePhone('abcde')).toBe(false)
    expect(isPlausiblePhone('12345')).toBe(false)
  })

  it('accepts e-mails with a domain and rejects foo@bar', () => {
    expect(isPlausibleEmail('a@b.co')).toBe(true)
    expect(isPlausibleEmail('foo@bar')).toBe(false)
  })
})
