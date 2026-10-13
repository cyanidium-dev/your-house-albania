import { describe, expect, it } from 'vitest'
import { groupBuildingStacks, stackKeyOf, stackPointOf, stackTotalOf, type StackPoint } from '../buildingStacks'

const point = (slug: string, lat: number, lng: number, total: number | null = null, approximate = false): StackPoint => ({
  slug,
  lat,
  lng,
  total,
  approximate,
})

describe('groupBuildingStacks', () => {
  it('groups listings whose coordinates agree to five decimals and leaves the rest out', () => {
    const stacks = groupBuildingStacks([
      point('a', 41.239941, 19.520265),
      point('b', 41.2399412, 19.5202648),
      point('c', 41.23995, 19.520265),
    ])
    expect(stacks.get('a')?.map((p) => p.slug)).toEqual(['a', 'b'])
    expect(stacks.get('b')).toBe(stacks.get('a'))
    expect(stacks.has('c')).toBe(false)
  })

  it('orders a building cheapest first, unpriced last, ties by slug', () => {
    const stacks = groupBuildingStacks([
      point('z-none', 41.1, 19.5),
      point('b-120k', 41.1, 19.5, 120_000),
      point('a-none', 41.1, 19.5),
      point('c-85k', 41.1, 19.5, 85_000),
      point('a-120k', 41.1, 19.5, 120_000),
    ])
    expect(stacks.get('c-85k')?.map((p) => p.slug)).toEqual(['c-85k', 'a-120k', 'b-120k', 'a-none', 'z-none'])
  })

  it('counts a slug once even if it arrives twice', () => {
    const stacks = groupBuildingStacks([point('a', 41.1, 19.5), point('a', 41.1, 19.5)])
    expect(stacks.size).toBe(0)
  })
})

describe('stackTotalOf', () => {
  it('takes only a positive total: a per-m² rate or "on request" is no "from" price', () => {
    expect(stackTotalOf(85_000)).toBe(85_000)
    expect(stackTotalOf(85_000, 'total')).toBe(85_000)
    expect(stackTotalOf(1_300, 'per-sqm')).toBeNull()
    expect(stackTotalOf(0)).toBeNull()
    expect(stackTotalOf(undefined)).toBeNull()
    expect(stackTotalOf(Number.NaN)).toBeNull()
  })
})

describe('stackPointOf', () => {
  it('skips what the map would not draw', () => {
    expect(stackPointOf({ slug: 'a', coordinates: null })).toBeNull()
    expect(stackPointOf({ slug: '', coordinates: { lat: 41, lng: 19 } })).toBeNull()
    expect(stackPointOf({ slug: 'a', coordinates: { lat: Number.NaN, lng: 19 } })).toBeNull()
    expect(stackPointOf({ slug: 'a', coordinates: { lat: 41, lng: 19 }, price: 90_000, locationPrecision: 'approximate' })).toEqual({
      slug: 'a',
      lat: 41,
      lng: 19,
      total: 90_000,
      approximate: true,
    })
  })

  it('keys a point by its rounded coordinates', () => {
    expect(stackKeyOf(41.239941, 19.520265)).toBe('41.23994,19.52026')
  })
})
