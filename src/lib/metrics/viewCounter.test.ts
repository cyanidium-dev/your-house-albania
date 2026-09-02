import { describe, expect, it } from 'vitest'
import { isCountableSlug, isViewKind, viewDocId } from './viewCounter'

describe('isViewKind', () => {
  it('accepts the two counted kinds and nothing else', () => {
    expect(isViewKind('property')).toBe(true)
    expect(isViewKind('post')).toBe(true)
    expect(isViewKind('landing')).toBe(false)
    expect(isViewKind(undefined)).toBe(false)
  })
})

describe('isCountableSlug', () => {
  it('accepts ordinary slugs', () => {
    expect(isCountableSlug('plazh-1br-70m')).toBe(true)
    expect(isCountableSlug('a')).toBe(true)
  })

  it('rejects anything that could reshape the document id', () => {
    // The value arrives in a request body and becomes part of `_id`.
    for (const bad of ['../other', 'Slug', 'a b', 'a/b', '-leading', '', 'a'.repeat(200), 42, null]) {
      expect(isCountableSlug(bad)).toBe(false)
    }
  })
})

describe('viewDocId', () => {
  it('namespaces by kind so a listing and a post can share a slug', () => {
    expect(viewDocId('property', 'durres-1br')).toBe('view-property-durres-1br')
    expect(viewDocId('post', 'durres-1br')).toBe('view-post-durres-1br')
  })
})
