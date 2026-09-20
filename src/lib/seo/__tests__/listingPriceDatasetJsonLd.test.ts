import { describe, expect, it } from 'vitest'
import { buildListingPriceDatasetJsonLd } from '../listingPriceDatasetJsonLd'

const input = {
  baseUrl: 'https://www.domlivo.com/',
  pageUrl: '/en/albania/durres/info',
  locale: 'en',
  cityName: 'Durrës',
  listingCount: 358,
  districtNames: ['Golem', 'Plazh'],
  asOf: '2026-09-20',
  minFlatsPerRow: 3,
}

describe('buildListingPriceDatasetJsonLd', () => {
  const json = buildListingPriceDatasetJsonLd(input) as Record<string, any>

  it('names a moment and a sample size, so the figures can be cited', () => {
    expect(json['@type']).toBe('Dataset')
    expect(json.dateModified).toBe('2026-09-20')
    expect(json.temporalCoverage).toBe('2026-09-20')
    expect(json.description).toContain('358 sale listings')
    expect(json.description).toContain('2026-09-20')
  })

  it('says these are asking prices and never claims sales', () => {
    expect(json.description).toContain('Asking prices, not completed sales')
    expect(json.name.toLowerCase()).toContain('asking prices')
  })

  it('points at the page and at the one Organization node of the site', () => {
    expect(json.url).toBe('https://www.domlivo.com/en/albania/durres/info')
    expect(json['@id']).toBe('https://www.domlivo.com/en/albania/durres/info#listing-price-index')
    expect(json.creator['@id']).toBe('https://www.domlivo.com/#organization')
  })

  it('lists the districts that have a row, and omits the key when none do', () => {
    expect(json.spatialCoverage.containsPlace.map((p: { name: string }) => p.name)).toEqual(['Golem', 'Plazh'])
    const empty = buildListingPriceDatasetJsonLd({ ...input, districtNames: [] }) as Record<string, any>
    expect(empty.spatialCoverage.containsPlace).toBeUndefined()
  })
})
