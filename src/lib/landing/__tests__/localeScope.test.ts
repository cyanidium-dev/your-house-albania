import { describe, expect, it } from 'vitest'
import { isLandingInLocale, landingLocales } from '../localeScope'

describe('landingLocales', () => {
  it('returns [] for undefined, null, non-arrays and empty arrays', () => {
    expect(landingLocales({})).toEqual([])
    expect(landingLocales({ locales: null })).toEqual([])
    expect(landingLocales({ locales: 'pl' })).toEqual([])
    expect(landingLocales({ locales: [] })).toEqual([])
  })
  it('normalises entries and drops junk', () => {
    expect(landingLocales({ locales: [' PL ', 'ru', 3, ''] })).toEqual(['pl', 'ru'])
  })
})

describe('isLandingInLocale', () => {
  it('is true for every locale when no scope is set', () => {
    expect(isLandingInLocale({}, 'en')).toBe(true)
    expect(isLandingInLocale({ locales: [] }, 'sq')).toBe(true)
  })
  it('is true only for listed locales when a scope is set', () => {
    const doc = { locales: ['pl'] }
    expect(isLandingInLocale(doc, 'pl')).toBe(true)
    expect(isLandingInLocale(doc, 'en')).toBe(false)
    expect(isLandingInLocale(doc, 'PL')).toBe(true)
  })
})
