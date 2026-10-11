import { describe, expect, it } from 'vitest'
import { buildCatalogFilterUrl } from '../buildCatalogFilterUrl'

const base = {
  locale: 'en',
  effectiveDeal: 'any',
  priceTuple: [0, 1_000_000] as [number, number],
  priceRangesByDeal: { any: { min: 0, max: 1_000_000 } },
  areaValues: [0, 1000] as [number, number],
  defaultAreaRange: { min: 0, max: 1000 },
  beds: 'any',
  stage: 'any',
  sort: 'newest',
  amenities: [],
  pageSize: '24',
  city: 'durres',
  district: '',
  initialAgentSlug: '',
  initialCountrySlug: 'albania',
  locations: [{ value: 'durres', countrySlug: 'albania' }],
}

describe('buildCatalogFilterUrl hidden filters', () => {
  it('drops ?types when the form sets a type', () => {
    const url = buildCatalogFilterUrl({ ...base, currentSearch: 'types=apartment,studio', type: 'villa' })
    expect(url).not.toContain('types=')
  })
  it('keeps the page facet near the sea and exact rooms when the form leaves them alone', () => {
    const url = buildCatalogFilterUrl({ ...base, currentSearch: '', type: '', keepNearSea: true, keepBedsExact: '1' })
    expect(url).toContain('nearSea=1')
    expect(url).toContain('bedsExact=1')
  })
  it('lets the form rooms replace exact rooms', () => {
    const url = buildCatalogFilterUrl({ ...base, currentSearch: 'bedsExact=1', type: '', beds: '2', keepBedsExact: '1' })
    expect(url).toContain('beds=2')
    expect(url).not.toContain('bedsExact')
  })
})
