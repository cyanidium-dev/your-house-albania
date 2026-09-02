import { describe, expect, it } from 'vitest'
import { __testables } from './tools'
import { AI_MAX_CARDS } from './limits'

const { sanitizeSlugs, buildCatalogUrl } = __testables

describe('sanitizeSlugs', () => {
  it('keeps well-formed slugs in the order the model ranked them', () => {
    expect(sanitizeSlugs(['plazh-1br', 'golem-2br'])).toEqual(['plazh-1br', 'golem-2br'])
  })

  it('drops anything that is not a plain slug', () => {
    // The model's output reaches a GROQ query, so nothing but [a-z0-9-] passes.
    expect(
      sanitizeSlugs(['ok-slug', 'Bad Slug', '../etc', '*', '', 42, null, { slug: 'x' }]),
    ).toEqual(['ok-slug'])
  })

  it('lowercases and de-duplicates', () => {
    expect(sanitizeSlugs(['Plazh-1BR', 'plazh-1br'])).toEqual(['plazh-1br'])
  })

  it('caps the list at the card limit', () => {
    const many = Array.from({ length: AI_MAX_CARDS + 3 }, (_, i) => `slug-${i}`)
    expect(sanitizeSlugs(many)).toHaveLength(AI_MAX_CARDS)
  })

  it('returns nothing for a non-array input', () => {
    expect(sanitizeSlugs('plazh-1br')).toEqual([])
    expect(sanitizeSlugs(undefined)).toEqual([])
  })
})

describe('buildCatalogUrl', () => {
  it('is undefined when the model passed no filters — no link beats an empty one', async () => {
    expect(await buildCatalogUrl('ru', undefined)).toBeUndefined()
    expect(await buildCatalogUrl('ru', {})).toBeUndefined()
  })

  it('puts price bounds in the query string of a locale-prefixed catalog URL', async () => {
    const url = await buildCatalogUrl('ru', { maxPrice: 100000 })
    expect(url).toContain('/ru/')
    expect(url).toContain('maxPrice=100000')
  })

  it('ignores non-positive numbers instead of emitting maxPrice=0', async () => {
    const url = await buildCatalogUrl('ru', { maxPrice: 0, beds: -2, minPrice: 50000 })
    expect(url).toContain('minPrice=50000')
    expect(url).not.toContain('maxPrice')
    expect(url).not.toContain('beds')
  })
})
