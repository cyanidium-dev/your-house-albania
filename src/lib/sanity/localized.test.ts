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
