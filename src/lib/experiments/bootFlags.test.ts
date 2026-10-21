import { describe, expect, it } from 'vitest'
import { BOOT_FLAGS, experimentBootScript, posthogStorageKey } from './bootFlags'

function run(script: string, stored: Record<string, string>) {
  const attrs: Record<string, string> = {}
  const document = { documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v } } }
  const localStorage = { getItem: (k: string) => stored[k] ?? null }
  new Function('document', 'localStorage', script)(document, localStorage)
  return attrs
}

describe('experimentBootScript', () => {
  const token = 'phc_test'
  const key = posthogStorageKey(token)

  it('copies the stored variants of the boot flags onto <html>', () => {
    const attrs = run(experimentBootScript(token), {
      [key]: JSON.stringify({
        $enabled_feature_flags: {
          'catalog-mobile-compact-head': 'compact',
          'e003-listing-photo-first-on-phones': 'control',
          'listing-contact-order': 'messenger-first',
        },
      }),
    })
    expect(attrs).toEqual({
      'data-x-catalog-mobile-compact-head': 'compact',
      'data-x-e003-listing-photo-first-on-phones': 'control',
    })
  })

  it('ignores unknown variants, booleans and broken storage', () => {
    expect(run(experimentBootScript(token), { [key]: JSON.stringify({ $enabled_feature_flags: { 'e004-cards-without-above-market-label': 'other', 'catalog-mobile-compact-head': true } }) })).toEqual({})
    expect(run(experimentBootScript(token), { [key]: '{not json' })).toEqual({})
    expect(run(experimentBootScript(token), {})).toEqual({})
  })

  it('is empty without a token', () => {
    expect(experimentBootScript('')).toBe('')
  })

  it('names each flag once', () => {
    expect(new Set(BOOT_FLAGS.map((f) => f.key)).size).toBe(BOOT_FLAGS.length)
  })

  it('builds the key as posthog-js does', () => {
    expect(posthogStorageKey('phc_a+b/c=')).toBe('ph_phc_aPLbSLcEQ_posthog')
  })
})
