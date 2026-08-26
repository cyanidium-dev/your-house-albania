import { describe, expect, it } from 'vitest'
import { mapSiteSettingsToResolved, normalizePolicyLinks } from './siteSettingsAdapter'

describe('normalizePolicyLinks', () => {
  it('trims and locale-resolves relative hrefs', () => {
    expect(normalizePolicyLinks([{ href: ' privacy ', label: { en: 'Privacy' } }], 'en'))
      .toEqual([{ href: '/en/privacy', label: 'Privacy' }])
    expect(normalizePolicyLinks([{ href: '/privacy', label: { en: 'Privacy' } }], 'sq'))
      .toEqual([{ href: '/sq/privacy', label: 'Privacy' }])
  })
  it('leaves external and already-prefixed hrefs alone', () => {
    expect(normalizePolicyLinks([{ href: 'https://x.test/p', label: { en: 'P' } }], 'en')[0]?.href).toBe('https://x.test/p')
    expect(normalizePolicyLinks([{ href: '/en/privacy', label: { en: 'P' } }], 'en')[0]?.href).toBe('/en/privacy')
  })
  it('drops entries with empty href or empty label', () => {
    expect(normalizePolicyLinks([{ href: '   ', label: { en: 'P' } }], 'en')).toEqual([])
    expect(normalizePolicyLinks([{ href: '/p', label: { en: '' } }], 'en')).toEqual([])
    expect(normalizePolicyLinks([{ href: '/p' }], 'en')).toEqual([])
    expect(normalizePolicyLinks(undefined, 'en')).toEqual([])
  })
})

describe('mapSiteSettingsToResolved — footerGuideLinks (ТЗ-16)', () => {
  it('normalizes guide links exactly like policy links', () => {
    const resolved = mapSiteSettingsToResolved(
      { footerGuideLinks: [{ href: '/guides/buying', label: { en: 'Buying guides' } }] } as never,
      'en',
    )
    expect(resolved.footerGuideLinks).toEqual([{ href: '/en/guides/buying', label: 'Buying guides' }])
  })
  it('yields [] when the field is absent or the whole settings object is null', () => {
    expect(mapSiteSettingsToResolved({} as never, 'en').footerGuideLinks).toEqual([])
    expect(mapSiteSettingsToResolved(null, 'en').footerGuideLinks).toEqual([])
  })
})
