import { describe, expect, it } from 'vitest'
import { parseCatalogFilters } from './parseCatalogFilters'

describe('parseCatalogFilters: landing "see all" links', () => {
  it('reads several cities and the near-sea and price filters', () => {
    const f = parseCatalogFilters({}, { cities: 'Durres,vlore,', nearSea: '1', maxPrice: '100000', minPrice: '20000' })
    expect(f.cities).toEqual(['durres', 'vlore'])
    expect(f.nearSea).toBe(true)
    expect(f.maxPrice).toBe(100000)
    expect(f.minPrice).toBe(20000)
  })

  it('no cities param is an empty list', () => {
    expect(parseCatalogFilters({ city: 'durres' }, {}).cities).toEqual([])
  })
})
