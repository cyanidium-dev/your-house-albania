import { describe, expect, it } from 'vitest'
import { fillLiveTokens, fillSeoLiveTokens, liveTokenScope, liveTokenValues } from '../liveTokens'

describe('live tokens', () => {
  it('fills the figures and drops a token with no value', () => {
    expect(fillLiveTokens('{count} ofert od {fromPrice}', { count: '612', fromPrice: '39 000 €' })).toBe(
      '612 ofert od 39 000 €',
    )
    expect(fillLiveTokens('Ponad {count} ofert', null)).toBe('Ponad ofert')
    expect(fillLiveTokens('No tokens here', null)).toBe('No tokens here')
  })

  it('formats in the page locale', () => {
    const v = liveTokenValues(
      { count: 1234, fromPrice: 39000, medianPricePerSqm: 1650, nearSeaShare: 40, newBuildShare: 20 },
      'de',
    )
    expect(v?.count).toBe('1.234')
    expect(v?.fromPrice).toMatch(/^39\.000\s€$/)
    expect(v?.medianPricePerSqm).toMatch(/^1\.650\s€\/m²$/)
    expect(liveTokenValues({ count: 0, fromPrice: null, medianPricePerSqm: null, nearSeaShare: null, newBuildShare: null }, 'de')).toBeNull()
  })

  it('takes the filter of the inventory band first, else of the first auto feed', () => {
    const band = { _type: 'inventorySummarySection', filters: { city: 'durres', nearSea: true } }
    const feed = { _type: 'propertyCarouselSection', mode: 'auto', filters: { maxPrice: 70000 } }
    expect(liveTokenScope([feed, band])).toEqual({ city: 'durres', nearSea: true })
    expect(liveTokenScope([feed])).toEqual({ maxPrice: 70000 })
    expect(liveTokenScope([{ _type: 'faqSection' }])).toBeNull()
  })

  it('fills SEO fields for the locale only', () => {
    const seo = { metaTitle: { pl: '{count} ofert nad morzem' }, metaDescription: { pl: 'Od {fromPrice}.' }, noIndex: false }
    expect(fillSeoLiveTokens(seo, 'pl', { count: '612', fromPrice: '39 000 €' })).toEqual({
      metaTitle: { pl: '612 ofert nad morzem' },
      metaDescription: { pl: 'Od 39 000 €.' },
      noIndex: false,
    })
  })
})
