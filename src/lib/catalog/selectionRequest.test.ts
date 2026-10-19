import { describe, expect, it } from 'vitest'
import { buildSelectionCriteria, showsSelectionBlock } from './selectionRequest'

const labels = {
  money: (n: number) => `€${n / 1000}k`,
  priceRange: (a: string, b: string) => `${a}–${b}`,
  priceUpTo: (a: string) => `up to ${a}`,
  priceOver: (a: string) => `over ${a}`,
  bedsFrom: (n: number) => `${n}+ bd`,
  bedsExact: (n: number) => `${n} bd`,
}

describe('buildSelectionCriteria', () => {
  it('lists every filter for the visitor and the operator', () => {
    const r = buildSelectionCriteria(
      {
        city: { slug: 'durres', label: 'Durrës' },
        type: { slug: 'apartment', label: 'Apartment' },
        deal: { value: 'sale', label: 'Sale' },
        minPrice: 50000,
        maxPrice: 120000,
        beds: 2,
      },
      labels,
    )
    expect(r.chips).toEqual(['Durrës', 'Apartment', 'Sale', '€50k–€120k', '2+ bd'])
    expect(r.message).toBe(
      [
        'Catalogue selection request',
        'City: Durrës (durres)',
        'Type: Apartment (apartment)',
        'Deal: sale',
        'Price: 50,000 EUR – 120,000 EUR',
        'Bedrooms: 2+',
      ].join('\n'),
    )
  })

  it('prefers the exact bedroom count and handles one-sided prices', () => {
    const r = buildSelectionCriteria({ maxPrice: 70000, beds: 1, bedsExact: 2 }, labels)
    expect(r.chips).toEqual(['up to €70k', '2 bd'])
    expect(r.message).toContain('Price: up to 70,000 EUR')
    expect(r.message).toContain('Bedrooms: 2')
    expect(buildSelectionCriteria({ minPrice: 200000 }, labels).chips).toEqual(['over €200k'])
  })

  it('says so when nothing is filtered', () => {
    const r = buildSelectionCriteria({}, labels)
    expect(r.chips).toEqual([])
    expect(r.message).toBe('Catalogue selection request\nNo filters set')
  })
})

describe('showsSelectionBlock', () => {
  it('is off on page 1 until more cards are loaded', () => {
    expect(showsSelectionBlock(1, 24, 24)).toBe(false)
    expect(showsSelectionBlock(1, 48, 24)).toBe(true)
    expect(showsSelectionBlock(2, 24, 24)).toBe(true)
  })
})
