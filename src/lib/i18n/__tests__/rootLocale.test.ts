import { describe, expect, it } from 'vitest'
import { negotiateRootLocale } from '../rootLocale'

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de']

describe('negotiateRootLocale', () => {
  it('picks a site language by its subtag', () => {
    expect(negotiateRootLocale('de-CH,de;q=0.9,en;q=0.8', LOCALES, 'en')).toBe('de')
    expect(negotiateRootLocale('sq-XK', LOCALES, 'en')).toBe('sq')
    expect(negotiateRootLocale('ru-RU,ru;q=0.9', LOCALES, 'en')).toBe('ru')
  })

  it('falls back to English for languages the site does not have', () => {
    expect(negotiateRootLocale('fr-FR,fr;q=0.9', LOCALES, 'en')).toBe('en')
    expect(negotiateRootLocale('he-IL,he;q=0.9', LOCALES, 'en')).toBe('en')
    expect(negotiateRootLocale('', LOCALES, 'en')).toBe('en')
    expect(negotiateRootLocale(null, LOCALES, 'en')).toBe('en')
  })

  it('takes the first supported language in preference order', () => {
    expect(negotiateRootLocale('fr-FR,fr;q=0.9,it;q=0.8,en;q=0.7', LOCALES, 'en')).toBe('it')
    expect(negotiateRootLocale('en;q=0.5,pl', LOCALES, 'en')).toBe('pl')
    expect(negotiateRootLocale('uk;q=0,ru', LOCALES, 'en')).toBe('ru')
  })
})
