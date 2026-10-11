import { describe, expect, it } from 'vitest'
import {
  landingScopeCatalogHref,
  normalizeLandingListingFilter,
  resolveLandingListingScope,
} from '../listingFilter'

describe('normalizeLandingListingFilter', () => {
  it('keeps the old filter shape working', () => {
    expect(
      normalizeLandingListingFilter({ city: 'durres', propertyType: 'apartment', deal: 'sale', stage: 'unfinished', investment: true }),
    ).toEqual({ city: 'durres', propertyType: 'apartment', deal: 'sale', stage: 'unfinished', investment: true })
  })

  it('reads the new fields and drops junk', () => {
    expect(
      normalizeLandingListingFilter({
        cities: ['Durres', 'vlore', null, 'durres'],
        minPrice: '0',
        maxPrice: 100000,
        nearSea: true,
        stage: 'demolished',
        investment: 'yes',
        propertyTypes: ['house', 'villa'],
      }),
    ).toEqual({ cities: ['durres', 'vlore'], maxPrice: 100000, nearSea: true, propertyTypes: ['house', 'villa'] })
    expect(normalizeLandingListingFilter(null)).toEqual({})
  })
})

describe('resolveLandingListingScope', () => {
  it('maps the filter onto catalogue filters', () => {
    expect(
      resolveLandingListingScope({ city: 'durres', maxPrice: 100000, nearSea: true, propertyType: 'apartment' }),
    ).toEqual({ city: 'durres', maxPrice: 100000, nearSea: true, type: 'apartment' })
  })

  it('one city in `cities` is a city scope, several are an OR', () => {
    expect(resolveLandingListingScope({ cities: ['durres'] })).toEqual({ city: 'durres' })
    expect(resolveLandingListingScope({ city: 'durres', cities: ['vlore', 'durres'] })).toEqual({
      cities: ['durres', 'vlore'],
    })
  })

  it('a filter with no place follows the page, district first', () => {
    const linkedZone = { type: 'district' as const, slug: 'plazh', citySlug: 'durres' }
    expect(resolveLandingListingScope({ nearSea: true }, { linkedZone })).toEqual({
      nearSea: true,
      district: 'plazh',
      city: 'durres',
    })
    expect(resolveLandingListingScope({ nearSea: true })).toEqual({ nearSea: true })
    expect(resolveLandingListingScope({})).toBeNull()
    expect(resolveLandingListingScope(undefined, { citySlug: 'tirana' })).toEqual({ city: 'tirana' })
  })
})

describe('landingScopeCatalogHref', () => {
  it('one city with a facet filter links the facet page', () => {
    expect(landingScopeCatalogHref('pl', { city: 'durres', nearSea: true }, { countrySlug: 'albania' })).toBe(
      '/pl/albania/durres/near-the-sea',
    )
  })

  it('one city with other filters links the city listing with a query', () => {
    expect(
      landingScopeCatalogHref('de', { city: 'durres', nearSea: true, maxPrice: 100000 }, { countrySlug: 'albania', sort: 'priceAsc' }),
    ).toBe('/de/albania/durres?maxPrice=100000&nearSea=1&sort=priceAsc')
  })

  it('a type goes into the path behind the sole public deal', () => {
    expect(landingScopeCatalogHref('en', { city: 'durres', type: 'house' }, { countrySlug: 'albania' })).toBe(
      '/en/albania/durres/sale/house',
    )
  })

  it('several cities go to the catalogue with the filter as query', () => {
    expect(landingScopeCatalogHref('ru', { cities: ['durres', 'vlore'], nearSea: true })).toBe(
      '/ru/catalog?cities=durres%2Cvlore&nearSea=1',
    )
  })

  it('a sort the catalogue cannot show stays off the link', () => {
    expect(landingScopeCatalogHref('en', { maxPrice: 70000 }, { sort: 'pricePerSqmAsc' })).toBe('/en/catalog?maxPrice=70000')
  })
})
