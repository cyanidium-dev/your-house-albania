import { describe, expect, it } from 'vitest'
import { resolveCta, resolveLocaleHref } from './resolveLocaleHref'

describe('resolveLocaleHref (existing behaviour, pinned)', () => {
  it('prefixes bare segments and leading-slash paths', () => {
    expect(resolveLocaleHref('contacts', 'en')).toBe('/en/contacts')
    expect(resolveLocaleHref('/contacts', 'en')).toBe('/en/contacts')
  })
  it('leaves already-prefixed, external and anchor hrefs alone', () => {
    expect(resolveLocaleHref('/en/contacts', 'en')).toBe('/en/contacts')
    expect(resolveLocaleHref('https://x.test/a', 'en')).toBe('https://x.test/a')
    expect(resolveLocaleHref('mailto:a@b.c', 'en')).toBe('mailto:a@b.c')
    expect(resolveLocaleHref('#faq', 'en')).toBe('#faq')
  })
  it('returns # for empty / whitespace', () => {
    expect(resolveLocaleHref('', 'en')).toBe('#')
    expect(resolveLocaleHref('   ', 'en')).toBe('#')
  })
})

describe('resolveCta', () => {
  it('trims label and href and resolves the href', () => {
    expect(resolveCta(' Contact ', ' contacts ', 'en')).toEqual({ label: 'Contact', href: '/en/contacts' })
  })
  it('returns null when href is empty or whitespace', () => {
    expect(resolveCta('Contact', '  ', 'en')).toBeNull()
    expect(resolveCta('Contact', '', 'en')).toBeNull()
    expect(resolveCta('Contact', undefined, 'en')).toBeNull()
  })
  it('returns null when label is empty or whitespace', () => {
    expect(resolveCta('  ', '/x', 'en')).toBeNull()
    expect(resolveCta(null, '/x', 'en')).toBeNull()
  })
  it('does not double-prefix and passes external through', () => {
    expect(resolveCta('X', '/en/contacts', 'en')?.href).toBe('/en/contacts')
    expect(resolveCta('X', 'https://x.test', 'en')?.href).toBe('https://x.test')
  })
  it('ignores non-string inputs', () => {
    expect(resolveCta(42 as unknown, { href: '/x' } as unknown, 'en')).toBeNull()
  })
})

/**
 * CMS copy is full of links pasted from the live site, so a Russian article
 * carries `/en/blog/...`. Prefixing that with the reader's locale produced
 * `/ru/en/blog/...` — a 404 on every locale but English.
 */
describe('resolveLocaleHref (foreign locale prefixes)', () => {
  it('replaces a foreign locale prefix instead of stacking another one', () => {
    expect(resolveLocaleHref('/en/blog/buying-apartment-durres-complete-guide', 'ru')).toBe(
      '/ru/blog/buying-apartment-durres-complete-guide',
    )
    expect(resolveLocaleHref('/sq/albania/tirana/districts/blloku', 'it')).toBe(
      '/it/albania/tirana/districts/blloku',
    )
  })
  it('maps another locale root to this one', () => {
    expect(resolveLocaleHref('/en', 'pl')).toBe('/pl')
  })
  it('does not mistake an ordinary path segment for a locale', () => {
    expect(resolveLocaleHref('/investment/sale', 'uk')).toBe('/uk/investment/sale')
    expect(resolveLocaleHref('/entrance', 'ru')).toBe('/ru/entrance')
  })
  it('honours an explicit locale list', () => {
    expect(resolveLocaleHref('/en/contacts', 'ru', ['ru'])).toBe('/ru/en/contacts')
  })
})

/**
 * CMS CTAs link `/albania/{city}[/{district}]/sale`, which duplicated the bare
 * listing while sale is the only public deal and now redirects to it.
 */
describe('resolveLocaleHref (place listings under the sole public deal)', () => {
  it('drops the deal from city and district listing links', () => {
    expect(resolveLocaleHref('/albania/sarande/sale', 'en')).toBe('/en/albania/sarande')
    expect(resolveLocaleHref('/en/albania/durres/golem-durres/sale', 'uk')).toBe('/uk/albania/durres/golem-durres')
    expect(resolveLocaleHref('/albania/durres/sale?sort=newest', 'ru')).toBe('/ru/albania/durres?sort=newest')
  })
  it('keeps typed listings, national deal pages and non-listing paths as written', () => {
    expect(resolveLocaleHref('/albania/durres/sale/apartment', 'en')).toBe('/en/albania/durres/sale/apartment')
    expect(resolveLocaleHref('/sale', 'en')).toBe('/en/sale')
    expect(resolveLocaleHref('/investment/sale', 'en')).toBe('/en/investment/sale')
    expect(resolveLocaleHref('/albania/durres/info', 'en')).toBe('/en/albania/durres/info')
    expect(resolveLocaleHref('/albania/durres/rent', 'en')).toBe('/en/albania/durres/rent')
  })
})
