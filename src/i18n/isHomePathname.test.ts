import { describe, expect, it } from 'vitest'
import { isHomePathname } from './isHomePathname'

describe('isHomePathname', () => {
  it('matches root and every configured locale root', () => {
    expect(isHomePathname('/')).toBe(true)
    for (const l of ['en', 'uk', 'ru', 'sq', 'it', 'pl']) {
      expect(isHomePathname(`/${l}`)).toBe(true)
      expect(isHomePathname(`/${l}/`)).toBe(true)
    }
  })
  it('rejects non-locales and nested paths', () => {
    expect(isHomePathname('/al')).toBe(false)
    expect(isHomePathname('/sq/contacts')).toBe(false)
    expect(isHomePathname('/en/sale')).toBe(false)
    expect(isHomePathname('')).toBe(false)
  })
  it('honours an explicit locale list', () => {
    expect(isHomePathname('/de', ['de', 'en'])).toBe(true)
    expect(isHomePathname('/sq', ['de', 'en'])).toBe(false)
  })
})
