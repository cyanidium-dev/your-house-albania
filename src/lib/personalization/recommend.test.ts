import { describe, expect, it } from 'vitest'
import { __testables as snap } from '@/lib/ai/catalogSnapshot'
import { criteriaFromViews, recommend } from './recommend'

const row = (slug: string, o: Record<string, unknown>) => ({
  slug,
  type: { slug: 'apartment' },
  city: { slug: 'durres' },
  createdAt: '2026-10-01T00:00:00Z',
  ...o,
})

const snapshot = snap.buildSnapshot([
  row('seen-a', { price: 90000, bedrooms: 1, district: { slug: 'plazh' } }),
  row('seen-b', { price: 110000, bedrooms: 2, district: { slug: 'plazh' } }),
  row('match-plazh', { price: 100000, bedrooms: 2, district: { slug: 'plazh' } }),
  row('match-golem', { price: 95000, bedrooms: 1, district: { slug: 'golem' } }),
  row('too-dear', { price: 400000, bedrooms: 2, district: { slug: 'golem' } }),
  row('villa', { price: 100000, bedrooms: 2, type: { slug: 'villa' } }),
  row('other-city', { price: 100000, bedrooms: 2, city: { slug: 'vlore' } }),
  row('new-one', { price: 105000, bedrooms: 2, createdAt: '2026-10-23T10:00:00Z' }),
] as never)

describe('welcome-back recommendations', () => {
  it('reads city, rooms and budget from the viewed listings', () => {
    const c = criteriaFromViews(snapshot.items.filter((i) => i.slug.startsWith('seen-')))
    expect(c).toMatchObject({ city: 'durres', type: 'apartment', minBedrooms: 1, maxBedrooms: 2, maxPrice: 132000 })
    expect(c?.districts).toEqual(['plazh'])
  })

  it('picks close matches in the same city, never the viewed ones', () => {
    const r = recommend(snapshot, ['seen-a', 'seen-b'], null)!
    expect(r.picks[0]).toBe('match-plazh')
    expect(r.picks).toContain('match-golem')
    expect(r.picks).not.toContain('seen-a')
    expect(r.picks).not.toContain('other-city')
    expect(r.picks).not.toContain('too-dear')
    expect(r.fresh).toEqual([])
  })

  it('lists matches created since the last visit separately', () => {
    const r = recommend(snapshot, ['seen-a', 'seen-b'], new Date('2026-10-22T00:00:00Z'))!
    expect(r.fresh).toEqual(['new-one'])
    expect(r.freshCount).toBe(1)
    expect(r.picks).not.toContain('new-one')
  })

  it('gives nothing when no viewed listing is in the catalog', () => {
    expect(recommend(snapshot, ['gone'], null)).toBeNull()
  })
})
