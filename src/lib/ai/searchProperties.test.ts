import { describe, expect, it } from 'vitest'
import { __testables as snap } from './catalogSnapshot'
import { runSearchProperties } from './searchProperties'

const snapshot = snap.buildSnapshot([
  { slug: 'a', price: 70000, area: 50, bedrooms: 1, city: { slug: 'durres' }, district: { slug: 'plazh' }, type: { slug: 'apartment' }, seaDistanceMeters: 100, description: { en: 'Sea view balcony' } },
  { slug: 'b', price: 120000, area: 80, bedrooms: 2, city: { slug: 'durres' }, type: { slug: 'apartment' }, seaDistanceMeters: 900 },
  { slug: 'c', price: 1200, priceUnit: 'per-sqm', area: 60, bedrooms: 1, city: { slug: 'vlore' }, type: { slug: 'apartment' }, constructionStage: 'off-plan' },
  { slug: 'd', price: 60000, area: 45, bedrooms: 1, city: { slug: 'shengjin' }, type: { slug: 'apartment' }, beachfront: true },
] as never)

const slugs = (out: string) => out.split('\n').slice(1).map((l) => l.split(' | ')[0])

describe('search_properties', () => {
  it('filters by city, bedrooms and budget', () => {
    expect(slugs(runSearchProperties({ city: 'durres', maxBedrooms: 1, maxPrice: 80000 }, snapshot))).toEqual(['a'])
  })

  it('compares an off-plan rate by rate × area', () => {
    expect(slugs(runSearchProperties({ maxPrice: 75000 }, snapshot))).toEqual(['d', 'a', 'c'])
  })

  it('treats beachfront as 0 m and unknown sea distance as not near', () => {
    expect(slugs(runSearchProperties({ maxSeaMeters: 150 }, snapshot)).sort()).toEqual(['a', 'd'])
  })

  it('matches keywords in the description', () => {
    expect(slugs(runSearchProperties({ keywords: 'sea view' }, snapshot))).toEqual(['a'])
  })

  it('says plainly when nothing matches', () => {
    expect(runSearchProperties({ city: 'tirana' }, snapshot)).toMatch(/^No listing matches/)
  })
})
