import { describe, expect, it } from 'vitest'
import { __testables } from './catalogSnapshot'

const { buildSnapshot, compactText } = __testables

const listing = {
  slug: 'plazh-1br',
  title: { en: 'One-Bedroom Apartment', ru: 'Квартира 1+1' },
  description: { en: 'Seventy metres from the beach, quiet street, furnished.' },
  price: 78000,
  area: 42,
  bedrooms: 1,
  bathrooms: 1,
  yearBuilt: 2019,
  status: 'sale',
  city: { slug: 'durres', title: { en: 'Durres' } },
  district: { slug: 'plazh', title: { en: 'Plazh' } },
  type: { slug: 'apartment', title: { en: 'Apartment' } },
  amenities: ['sea-view', 'furnished'],
}

describe('compactText', () => {
  it('collapses whitespace and truncates with an ellipsis', () => {
    expect(compactText('  a   b \n c ', 40)).toBe('a b c')
    expect(compactText('abcdefghij', 5)).toBe('abcde…')
  })

  it('returns an empty string for non-strings', () => {
    expect(compactText(undefined, 10)).toBe('')
    expect(compactText({ en: 'x' }, 10)).toBe('')
  })
})

describe('buildSnapshot', () => {
  it('writes one pipe-separated line per listing, with the derived price per m²', () => {
    const { lines } = buildSnapshot([listing])
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('plazh-1br')
    expect(lines[0]).toContain('Plazh/Durres')
    expect(lines[0]).toContain('78000 EUR')
    expect(lines[0]).toContain('42m2')
    // 78000 / 42, rounded — the model must not have to divide.
    expect(lines[0]).toContain('1857 EUR/m2')
    expect(lines[0]).toContain('sea-view,furnished')
  })

  it('skips rows without a slug — a card cannot be linked without one', () => {
    expect(buildSnapshot([{ ...listing, slug: undefined }]).lines).toHaveLength(0)
  })

  it('reports the true price floor so the model cannot invent cheaper stock', () => {
    const { facets } = buildSnapshot([listing, { ...listing, slug: 'other', price: 65000 }])
    expect(facets.priceMinEur).toBe(65000)
    expect(facets.priceMaxEur).toBe(78000)
    expect(facets.total).toBe(2)
  })

  it('counts stock per city, busiest first', () => {
    const { facets } = buildSnapshot([
      listing,
      { ...listing, slug: 'b' },
      { ...listing, slug: 'c', city: { slug: 'vlore', title: { en: 'Vlore' } } },
    ])
    expect(facets.cities.map((c) => [c.slug, c.count])).toEqual([
      ['durres', 2],
      ['vlore', 1],
    ])
  })

  it('is empty for an empty catalog rather than throwing', () => {
    const { lines, facets } = buildSnapshot([])
    expect(lines).toEqual([])
    expect(facets.total).toBe(0)
    expect(facets.priceMinEur).toBe(0)
  })
})
