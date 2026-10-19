import { describe, expect, it } from 'vitest'
import {
  START_PAYLOAD_MAX,
  buildGeneralStartPayload,
  buildPropertyStartPayload,
  buildSearchStartPayload,
  decodeSearchFilters,
  encodeSearchFilters,
  parseStartPayload,
  propertyIdCandidates,
} from './startPayload'

const LONG_SLUG = 'house-in-vlora-near-the-historical-part-of-the-city-109-sq-m-land-304--231025-1'

describe('buildPropertyStartPayload', () => {
  it('uses the slug when it fits', () => {
    expect(buildPropertyStartPayload({ locale: 'ru', slug: '2-bedroom-house-in-plazh-durres' })).toBe(
      'p_ru_2-bedroom-house-in-plazh-durres',
    )
  })

  it('falls back to the id key for a slug over the limit', () => {
    const p = buildPropertyStartPayload({
      locale: 'en',
      slug: LONG_SLUG,
      id: 'property-tg-ff52f65a-4218-41c9-b2a2-5bb96ff3339c',
    })
    expect(p).toBe('i_en_tg-ff52f65a-4218-41c9-b2a2-5bb96ff3339c')
    expect(p!.length).toBeLessThanOrEqual(START_PAYLOAD_MAX)
  })

  it('cuts an id that is still too long, and the prefix resolves it', () => {
    const id = `property-${'a'.repeat(80)}`
    const p = buildPropertyStartPayload({ locale: 'de', slug: LONG_SLUG, id })!
    expect(p.length).toBe(START_PAYLOAD_MAX)
    const parsed = parseStartPayload(p)
    expect(parsed?.kind).toBe('propertyId')
    if (parsed?.kind === 'propertyId') expect(id.startsWith(propertyIdCandidates(parsed.idKey)[0])).toBe(true)
  })

  it('returns null for a long slug without an id', () => {
    expect(buildPropertyStartPayload({ locale: 'en', slug: LONG_SLUG })).toBeNull()
  })

  it('never lets a non-ASCII slug into the payload', () => {
    expect(buildPropertyStartPayload({ locale: 'ru', slug: 'квартира', id: 'property-getal-1' })).toBe('i_ru_getal-1')
  })

  it('defends the locale', () => {
    expect(buildPropertyStartPayload({ locale: 'EN-gb', slug: 'flat' })).toBe('p_en_flat')
  })
})

describe('buildGeneralStartPayload', () => {
  it('names the placement', () => {
    expect(buildGeneralStartPayload({ locale: 'it', placement: 'footer' })).toBe('g_it_footer')
  })
  it('strips what Telegram refuses', () => {
    expect(buildGeneralStartPayload({ locale: 'pl', placement: 'contact page!' })).toBe('g_pl_contactpage')
    expect(buildGeneralStartPayload({ locale: 'pl', placement: '' })).toBe('g_pl_page')
  })
})

describe('parseStartPayload', () => {
  it('round-trips every kind', () => {
    expect(parseStartPayload('p_ru_flat-in-golem')).toEqual({ kind: 'property', locale: 'ru', slug: 'flat-in-golem' })
    expect(parseStartPayload('i_en_getal-19621')).toEqual({ kind: 'propertyId', locale: 'en', idKey: 'getal-19621' })
    expect(parseStartPayload('g_uk_contact-page')).toEqual({ kind: 'general', locale: 'uk', placement: 'contact-page' })
  })

  it('keeps underscores after the second separator', () => {
    expect(parseStartPayload('i_en_a_b')).toEqual({ kind: 'propertyId', locale: 'en', idKey: 'a_b' })
  })

  it.each(['', 'hello', 'x_en_flat', 'p_eng_flat', 'p_en_', 'p_en_flat!', 'p'.repeat(65), undefined, null])(
    'rejects %s',
    (raw) => {
      expect(parseStartPayload(raw as string)).toBeNull()
    },
  )
})

describe('search payloads', () => {
  it('encodes the search and reads it back', () => {
    const filters = {
      city: 'durres',
      deal: 'sale',
      type: 'apartment',
      minPrice: 50000,
      maxPrice: 120000,
      beds: 2,
      nearSea: true,
    }
    const p = buildSearchStartPayload({ locale: 'de', filters })
    expect(p).toBe('s_de_Cdurres_Lsale_Tapartment_P50000-120000_B2_N')
    expect(parseStartPayload(p)).toEqual({ kind: 'search', locale: 'de', filters })
  })

  it('keeps open ranges, exact bedrooms, stage, extra cities and types', () => {
    const encoded = encodeSearchFilters(
      { maxPrice: 90000, minArea: 40, bedsExact: 1, stage: 'unfinished', cities: ['vlore', 'sarande'], types: ['studio'] },
      64,
    )
    expect(encoded).toBe('P-90000_E1_A40-_Sunfinished_Mvlore_Msarande_Ystudio')
    expect(decodeSearchFilters(encoded!)).toEqual({
      maxPrice: 90000,
      minArea: 40,
      bedsExact: 1,
      stage: 'unfinished',
      cities: ['vlore', 'sarande'],
      types: ['studio'],
    })
  })

  it('drops the tokens that do not fit, never cuts one in half', () => {
    const p = buildSearchStartPayload({
      locale: 'en',
      filters: {
        city: 'durres',
        district: 'plazh-i-ri-hekurudha-lagjja-nr-13',
        deal: 'sale',
        type: 'apartment',
        minPrice: 50000,
        maxPrice: 120000,
        beds: 2,
        minArea: 40,
        maxArea: 90,
      },
    })!
    expect(p.length).toBeLessThanOrEqual(START_PAYLOAD_MAX)
    expect(parseStartPayload(p)).toEqual({
      kind: 'search',
      locale: 'en',
      filters: { city: 'durres', district: 'plazh-i-ri-hekurudha-lagjja-nr-13', deal: 'sale', type: 'apartment' },
    })
  })

  it('has nothing to subscribe to without filters', () => {
    expect(buildSearchStartPayload({ locale: 'en', filters: {} })).toBeNull()
    expect(buildSearchStartPayload({ locale: 'en', filters: { city: 'Durrës' } })).toBeNull()
    expect(parseStartPayload('s_en_Qfoo')).toBeNull()
  })

  it('skips what it does not understand and keeps the rest', () => {
    expect(decodeSearchFilters('Cdurres_Sfoo_B200_Px-y_Q1')).toEqual({ city: 'durres' })
  })
})
