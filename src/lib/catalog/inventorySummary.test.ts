import { describe, expect, it } from 'vitest'
import { summarizeInventory } from './inventorySummary'

describe('summarizeInventory', () => {
  it('counts, takes the lowest total and the median €/m², and the shares', () => {
    const s = summarizeInventory([
      { price: 100_000, area: 50, seaDistanceMeters: 120, constructionStage: 'completed' },
      { price: 80_000, area: 40, beachfront: true, constructionStage: 'off-plan' },
      { price: 1_500, priceUnit: 'per-sqm', seaDistanceMeters: 900, constructionStage: 'under-construction' },
      { price: 0, area: 60 },
    ])
    expect(s.count).toBe(4)
    expect(s.fromPrice).toBe(80_000) // a per-m² rate and a zero are not totals
    expect(s.medianPricePerSqm).toBe(2000) // 2000, 2000, 1500
    expect(s.nearSeaShare).toBe(50)
    expect(s.newBuildShare).toBe(50)
  })

  it('an empty filter has no figures', () => {
    expect(summarizeInventory([])).toEqual({
      count: 0,
      fromPrice: null,
      medianPricePerSqm: null,
      nearSeaShare: null,
      newBuildShare: null,
    })
  })
})
