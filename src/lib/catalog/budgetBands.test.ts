import { describe, expect, it } from 'vitest'
import { budgetBandQuery, inBudgetBand, liveBudgetBands, BUDGET_BANDS } from './budgetBands'

describe('liveBudgetBands', () => {
  it('keeps only bands with listings, counting like the catalogue filter', () => {
    const bands = liveBudgetBands([
      { price: 65000 },
      { price: 70000 },
      { price: 95000 },
      { price: 1500, priceUnit: 'per-sqm' },
      { price: 0 },
      { price: 450000 },
    ])
    expect(bands.map((b) => [b.key, b.count])).toEqual([
      ['under70', 2],
      ['70to120', 2],
      ['over200', 1],
    ])
  })

  it('returns nothing for a district without priced totals', () => {
    expect(liveBudgetBands([{ price: 1200, priceUnit: 'per-sqm' }])).toEqual([])
  })
})

describe('budget band helpers', () => {
  it('match the catalogue query both ends inclusive', () => {
    const mid = BUDGET_BANDS[1]
    expect(inBudgetBand(70000, mid)).toBe(true)
    expect(inBudgetBand(120000, mid)).toBe(true)
    expect(inBudgetBand(120001, mid)).toBe(false)
    expect(budgetBandQuery(mid).toString()).toBe('minPrice=70000&maxPrice=120000')
    expect(budgetBandQuery(BUDGET_BANDS[0]).toString()).toBe('maxPrice=70000')
    expect(budgetBandQuery(BUDGET_BANDS[3]).toString()).toBe('minPrice=200000')
  })
})
