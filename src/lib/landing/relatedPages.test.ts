import { describe, expect, it } from 'vitest'
import { clampRelatedLimit, resolveRelatedPagesQuery } from './relatedPages'

describe('resolveRelatedPagesQuery', () => {
  it('cityDistricts: explicit city ref slug wins over everything', () => {
    expect(
      resolveRelatedPagesQuery(
        { mode: 'cityDistricts', relatedCitySlug: 'vlore' },
        { citySlug: 'tirana', linkedZone: { type: 'city', id: 'x', citySlug: 'tirana' } },
      ),
    ).toEqual({ kind: 'cityDistricts', citySlug: 'vlore' })
  })

  it('cityDistricts: falls back to linkedZone.citySlug, then citySlug prop, then own city tag, then null', () => {
    expect(
      resolveRelatedPagesQuery(
        { mode: 'cityDistricts' },
        { linkedZone: { type: 'district', id: 'x', citySlug: 'durres' } },
      ),
    ).toEqual({ kind: 'cityDistricts', citySlug: 'durres' })
    expect(resolveRelatedPagesQuery({ mode: 'cityDistricts' }, { citySlug: 'shkoder' })).toEqual({
      kind: 'cityDistricts',
      citySlug: 'shkoder',
    })
    expect(
      resolveRelatedPagesQuery({ mode: 'cityDistricts' }, { topicTags: ['theme:x', 'city:sarande'] }),
    ).toEqual({ kind: 'cityDistricts', citySlug: 'sarande' })
    expect(resolveRelatedPagesQuery({ mode: 'cityDistricts' }, {})).toBeNull()
  })

  it('zoneComparisons: explicit zone → single tag; linkedZone slug next; else ALL own zone tags; else null', () => {
    expect(
      resolveRelatedPagesQuery({ mode: 'zoneComparisons', relatedZone: { slug: 'golem-durres' } }, {}),
    ).toEqual({ kind: 'zoneComparisons', zoneTags: ['zone:golem-durres'] })
    expect(
      resolveRelatedPagesQuery(
        { mode: 'zoneComparisons' },
        { linkedZone: { type: 'district', id: 'x', slug: 'plazh' } },
      ),
    ).toEqual({ kind: 'zoneComparisons', zoneTags: ['zone:plazh'] })
    expect(
      resolveRelatedPagesQuery(
        { mode: 'zoneComparisons' },
        { topicTags: ['zone:sarande', 'zone:ksamil', 'theme:comparison'] },
      ),
    ).toEqual({ kind: 'zoneComparisons', zoneTags: ['zone:sarande', 'zone:ksamil'] })
    expect(resolveRelatedPagesQuery({ mode: 'zoneComparisons' }, {})).toBeNull()
  })

  it('topicGuides: section tags win; else own tags; empty → null', () => {
    expect(
      resolveRelatedPagesQuery(
        { mode: 'topicGuides', topicTags: ['theme:buying'] },
        { topicTags: ['theme:market'] },
      ),
    ).toEqual({ kind: 'topicGuides', tags: ['theme:buying'] })
    expect(resolveRelatedPagesQuery({ mode: 'topicGuides' }, { topicTags: ['theme:market'] })).toEqual({
      kind: 'topicGuides',
      tags: ['theme:market'],
    })
    expect(resolveRelatedPagesQuery({ mode: 'topicGuides' }, {})).toBeNull()
  })

  it('manual resolves to manual; unknown or missing modes resolve to null', () => {
    expect(resolveRelatedPagesQuery({ mode: 'manual' }, {})).toEqual({ kind: 'manual' })
    expect(resolveRelatedPagesQuery({ mode: 'weird' }, {})).toBeNull()
    expect(resolveRelatedPagesQuery({}, {})).toBeNull()
  })

  it('ignores blank strings and non-array tags defensively', () => {
    expect(resolveRelatedPagesQuery({ mode: 'cityDistricts', relatedCitySlug: '  ' }, {})).toBeNull()
    expect(
      resolveRelatedPagesQuery({ mode: 'zoneComparisons' }, { topicTags: ['city:tirana'] }),
    ).toBeNull()
  })
})

describe('clampRelatedLimit', () => {
  it('clamps to 3..8 with default 6', () => {
    expect(clampRelatedLimit(undefined)).toBe(6)
    expect(clampRelatedLimit(null)).toBe(6)
    expect(clampRelatedLimit(1)).toBe(3)
    expect(clampRelatedLimit(99)).toBe(8)
    expect(clampRelatedLimit(4)).toBe(4)
    expect(clampRelatedLimit(Number.NaN)).toBe(6)
  })
})
