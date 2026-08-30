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
