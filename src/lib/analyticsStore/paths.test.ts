import { describe, expect, it } from 'vitest'
import { localeOfPath, MAX_PATH, normalizePath, pathFromUrl } from './paths'

describe('normalizePath', () => {
  it('keeps a clean path as it is', () => {
    expect(normalizePath('/en/property/apartment-2-1-durres')).toBe('/en/property/apartment-2-1-durres')
    expect(normalizePath('/')).toBe('/')
  })

  it('drops the query string and fragment, which can carry personal data', () => {
    expect(normalizePath('/en/contacts?email=a@b.c&utm_source=x')).toBe('/en/contacts')
    expect(normalizePath('/en/blog/post#comments')).toBe('/en/blog/post')
    expect(normalizePath('/?q=1')).toBe('/')
  })

  it('removes trailing slashes and collapses repeated ones', () => {
    expect(normalizePath('/en/')).toBe('/en')
    expect(normalizePath('/en//property///x//')).toBe('/en/property/x')
  })

  it('upper-cases percent escapes so one page is one row', () => {
    expect(normalizePath('/ru/%d0%ba%d0%b2')).toBe('/ru/%D0%BA%D0%B2')
  })

  it('refuses anything that is not a same-site path', () => {
    for (const bad of ['', 'en/property', 'https://evil.example/x', '//evil.example/x', '/a b', '/кв', '/a\n', 42, null, undefined, {}]) {
      expect(normalizePath(bad)).toBeNull()
    }
  })

  it('caps the length without leaving half an escape', () => {
    const long = `/${'a'.repeat(MAX_PATH - 2)}%D0%BA`
    const out = normalizePath(long)!
    expect(out.length).toBeLessThanOrEqual(MAX_PATH)
    expect(out).not.toMatch(/%[0-9A-F]?$/)
  })
})

describe('pathFromUrl', () => {
  it('strips the origin of absolute URLs, apex and www alike', () => {
    expect(pathFromUrl('https://www.domlivo.com/en/catalog/')).toBe('/en/catalog')
    expect(pathFromUrl('https://domlivo.com/en/catalog?x=1')).toBe('/en/catalog')
  })

  it('percent-encodes non-ASCII paths the way the browser reports them', () => {
    expect(pathFromUrl('https://www.domlivo.com/ru/кв')).toBe('/ru/%D0%BA%D0%B2')
  })

  it('accepts a bare path and refuses junk', () => {
    expect(pathFromUrl('/de/')).toBe('/de')
    expect(pathFromUrl('not a url')).toBeNull()
    expect(pathFromUrl(undefined)).toBeNull()
  })
})

describe('localeOfPath', () => {
  it('reads a site locale and nothing else', () => {
    expect(localeOfPath('/de/property/x')).toBe('de')
    expect(localeOfPath('/sq')).toBe('sq')
    expect(localeOfPath('/')).toBe('')
    expect(localeOfPath('/fr/property/x')).toBe('')
    expect(localeOfPath('/english')).toBe('')
  })
})
