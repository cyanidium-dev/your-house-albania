import { describe, expect, it } from 'vitest'
import {
  landingRowLocales,
  landingSitemapLocales,
  mergeLandingLocaleScopes,
  resolveLandingPathForSitemap,
} from '../landingSitemapPaths'

const ALL = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const

describe('landing sitemap locale scope', () => {
  it('normalises the CMS list', () => {
    expect(landingRowLocales({ locales: ['PL', 'pl', ' de ', ''] })).toEqual(['pl', 'de'])
    expect(landingRowLocales({ locales: null })).toEqual([])
    expect(landingRowLocales({})).toEqual([])
  })

  it('an empty scope is every locale, a set scope only its own', () => {
    expect(landingSitemapLocales([], ALL)).toEqual([...ALL])
    expect(landingSitemapLocales(['pl'], ALL)).toEqual(['pl'])
    expect(landingSitemapLocales(['de', 'xx'], ALL)).toEqual(['de'])
  })

  it('two documents on one path: union, and an unscoped one opens it to all', () => {
    expect(mergeLandingLocaleScopes(['pl'], ['de'])).toEqual(['pl', 'de'])
    expect(mergeLandingLocaleScopes(['pl'], [])).toEqual([])
  })

  it('a unique landing resolves to its top-level slug', () => {
    expect(
      resolveLandingPathForSitemap({ _id: 'x', slug: 'immobilien-albanien-am-meer', pageType: 'unique', locales: ['de'] }),
    ).toBe('immobilien-albanien-am-meer')
  })
})
