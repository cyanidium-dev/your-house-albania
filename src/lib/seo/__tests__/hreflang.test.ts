import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/seo/envSeo', () => ({ isIndexingEnabled: () => true }))
vi.mock('@/lib/siteUrl', () => ({ getSiteBaseUrl: () => 'https://www.domlivo.com' }))

import { buildHreflangAlternates } from '../hreflang'

describe('buildHreflangAlternates', () => {
  it('lists every routing locale plus x-default → en by default', () => {
    const out = buildHreflangAlternates('guides/buying')!
    expect(Object.keys(out.languages ?? {})).toEqual(['en', 'uk', 'ru', 'sq', 'it', 'pl', 'x-default'])
    expect((out.languages as Record<string, string>)['x-default']).toBe('https://www.domlivo.com/en/guides/buying')
  })
  it('restricts to the given locales and points x-default at the first one when en is absent', () => {
    const out = buildHreflangAlternates('guides/nieruchomosci-w-albanii', ['pl'])!
    expect(out.languages).toEqual({
      pl: 'https://www.domlivo.com/pl/guides/nieruchomosci-w-albanii',
      'x-default': 'https://www.domlivo.com/pl/guides/nieruchomosci-w-albanii',
    })
  })
  it('keeps x-default on en when en is in the subset', () => {
    const out = buildHreflangAlternates('guides/x', ['pl', 'en'])!
    expect((out.languages as Record<string, string>)['x-default']).toBe('https://www.domlivo.com/en/guides/x')
  })
  it('ignores locales outside routing', () => {
    const out = buildHreflangAlternates('guides/x', ['de', 'pl'])!
    expect(Object.keys(out.languages ?? {})).toEqual(['pl', 'x-default'])
  })
})
