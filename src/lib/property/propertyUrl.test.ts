import { describe, expect, it } from 'vitest'
import { PROPERTY_SLUG_MATCH, propertyPath, propertyUrlSlug } from './propertyUrl'

const localized = { en: 'apartment-2-1-plazh-durres-85m2', ru: 'kvartira-2-1-plazh-durres-85m2' }

describe('propertyUrlSlug', () => {
  it("uses the locale's own address", () => {
    expect(propertyUrlSlug('ru', 'shitet-apartament-12801', localized)).toBe('kvartira-2-1-plazh-durres-85m2')
  })

  it('falls back to the key where a locale has no address', () => {
    expect(propertyUrlSlug('de', 'shitet-apartament-12801', localized)).toBe('shitet-apartament-12801')
    expect(propertyUrlSlug('en', 'prodazha-studii-42m2', null)).toBe('prodazha-studii-42m2')
    expect(propertyUrlSlug('en', 'prodazha-studii-42m2', { en: '  ' })).toBe('prodazha-studii-42m2')
  })
})

describe('propertyPath', () => {
  it('prefixes the locale', () => {
    expect(propertyPath('en', 'x', localized)).toBe('/en/property/apartment-2-1-plazh-durres-85m2')
  })
})

describe('PROPERTY_SLUG_MATCH', () => {
  it('matches the key and every locale address', () => {
    expect(PROPERTY_SLUG_MATCH).toContain('slug.current == $slug')
    for (const l of ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de']) expect(PROPERTY_SLUG_MATCH).toContain(`localizedSlug.${l}`)
  })
})
