import { describe, expect, it } from 'vitest'
import { PROPERTY_SLUG_MATCH, englishSlugOfDerived, propertyPath, propertySlugParams, propertyUrlSlug } from './propertyUrl'

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

describe('derived French addresses', () => {
  const localizedSlug = { en: 'apartment-1-1-golem-durres-64m2', de: 'wohnung-1-1-golem-durres-64m2' }

  it('swaps the English type word', () => {
    expect(propertyUrlSlug('fr', 'key', localizedSlug)).toBe('appartement-1-1-golem-durres-64m2')
    expect(propertyUrlSlug('fr', 'key', { en: 'studio-plazh-durres-41m2' })).toBe('studio-plazh-durres-41m2')
    expect(propertyUrlSlug('fr', 'key', { en: 'land-arapaj-durres-3000m2' })).toBe('terrain-arapaj-durres-3000m2')
  })

  it('keeps the key without an English address', () => {
    expect(propertyUrlSlug('fr', 'prodazha-kvartiry', null)).toBe('prodazha-kvartiry')
  })

  it('maps a French address back to the English one for the lookup', () => {
    expect(propertySlugParams('appartement-1-1-golem-durres-64m2')).toEqual({
      slug: 'appartement-1-1-golem-durres-64m2',
      derivedSlug: 'apartment-1-1-golem-durres-64m2',
    })
    expect(englishSlugOfDerived('prodazha-kvartiry')).toBe('prodazha-kvartiry')
  })
})
