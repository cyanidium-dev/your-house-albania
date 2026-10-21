import { describe, expect, it } from 'vitest'
import { resolveLocalizedString, resolveLocalizedStringStrict } from './localized'

const field = { en: 'Real Estate in Albania', ru: 'Недвижимость в Албании' }

describe('resolveLocalizedString', () => {
  it('returns the requested locale when present', () => {
    expect(resolveLocalizedString(field, 'ru')).toBe('Недвижимость в Албании')
  })

  it('falls back to English for a missing locale', () => {
    expect(resolveLocalizedString(field, 'pl')).toBe('Real Estate in Albania')
  })
})

describe('resolveLocalizedStringStrict', () => {
  it('returns the requested locale when present', () => {
    expect(resolveLocalizedStringStrict(field, 'ru')).toBe('Недвижимость в Албании')
  })

  it('returns empty for a missing locale instead of the English fallback', () => {
    // The whole point: callers must be able to tell "not translated" from
    // "authored in English", so they can prefer a generated localized title.
    expect(resolveLocalizedStringStrict(field, 'pl')).toBe('')
  })

  it('treats a whitespace-only value as missing', () => {
    expect(resolveLocalizedStringStrict({ ...field, pl: '   ' }, 'pl')).toBe('')
  })

  it('trims the returned value', () => {
    expect(resolveLocalizedStringStrict({ ...field, pl: '  Nieruchomości  ' }, 'pl')).toBe('Nieruchomości')
  })

  it('returns empty for a null field', () => {
    expect(resolveLocalizedStringStrict(null, 'en')).toBe('')
  })
})

describe('repository translations (fr)', () => {
  // `fr` has no values in Sanity: the text comes from src/data/contentTranslations/fr.json.
  const district = { en: 'City Center', de: 'Stadtzentrum' }

  it('translates an English value that has an entry', () => {
    expect(resolveLocalizedString(district, 'fr')).toBe('Centre-ville')
    expect(resolveLocalizedStringStrict(district, 'fr')).toBe('Centre-ville')
  })

  it('falls back to English, and strict to empty, without an entry', () => {
    const field = { en: 'A sentence nobody translated' }
    expect(resolveLocalizedString(field, 'fr')).toBe('A sentence nobody translated')
    expect(resolveLocalizedStringStrict(field, 'fr')).toBe('')
  })

  it('leaves the other locales to Sanity', () => {
    expect(resolveLocalizedString(district, 'de')).toBe('Stadtzentrum')
    expect(resolveLocalizedString(district, 'pl')).toBe('City Center')
  })
})
