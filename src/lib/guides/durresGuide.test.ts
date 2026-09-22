import { describe, expect, it } from 'vitest'
import { buildLeadDocument } from '@/lib/leads/buildLeadDocument'
import { sampleContext } from '@/lib/leads/testFixtures'
import { LEAD_PLACEMENTS, LEAD_TYPES } from '@/lib/leads/types'
import { formatGuideLeadTelegram } from '@/lib/notifications/leads/formatLeadTelegram'
import {
  GUIDE_LOCALES,
  guideLeadInput,
  guidePdfFileName,
  guidePdfPath,
  isGuideLocale,
  offersDurresGuide,
  parseGuideRequest,
} from './durresGuide'

const valid = { locale: 'de', email: 'anna@example.com', consent: true, companyWebsite: '' }

describe('guide files', () => {
  it('names one static PDF per site locale', () => {
    expect(GUIDE_LOCALES).toEqual(['en', 'sq', 'uk', 'ru', 'it', 'pl', 'de'])
    expect(guidePdfFileName('pl')).toBe('durres-buying-guide.pl.pdf')
    expect(guidePdfPath('sq')).toBe('/guides/durres-buying-guide.sq.pdf')
    expect(isGuideLocale('fr')).toBe(false)
  })

  it('is offered on Durrës pages only', () => {
    expect(offersDurresGuide('durres')).toBe(true)
    expect(offersDurresGuide('Durres ')).toBe(true)
    expect(offersDurresGuide('vlore')).toBe(false)
    expect(offersDurresGuide(undefined)).toBe(false)
  })
})

describe('parseGuideRequest', () => {
  it('accepts a minimal valid body and trims the email', () => {
    const r = parseGuideRequest({ ...valid, email: '  anna@example.com ' })
    expect(r).toEqual({ ok: true, value: { locale: 'de', email: 'anna@example.com' } })
  })

  it('keeps an optional listing slug and passes the context through', () => {
    const r = parseGuideRequest({ ...valid, propertySlug: 'studio-plazh', context: { x: 1 } })
    expect(r.ok && r.value).toEqual({ locale: 'de', email: 'anna@example.com', propertySlug: 'studio-plazh', context: { x: 1 } })
  })

  it('rejects the honeypot, missing consent, bad locales, bad emails and bad slugs', () => {
    expect(parseGuideRequest({ ...valid, companyWebsite: 'http://spam' })).toEqual({ ok: false, error: 'Bad request' })
    expect(parseGuideRequest({ ...valid, consent: 'yes' })).toEqual({ ok: false, error: 'Consent required' })
    expect(parseGuideRequest({ ...valid, locale: 'fr' })).toEqual({ ok: false, error: 'Invalid locale' })
    expect(parseGuideRequest({ ...valid, email: '' })).toEqual({ ok: false, error: 'Missing email' })
    expect(parseGuideRequest({ ...valid, email: 'not an email' })).toEqual({ ok: false, error: 'Invalid email' })
    expect(parseGuideRequest({ ...valid, email: `${'a'.repeat(250)}@x.io` })).toEqual({ ok: false, error: 'Invalid email' })
    expect(parseGuideRequest({ ...valid, propertySlug: '../etc' })).toEqual({ ok: false, error: 'Invalid property' })
    expect(parseGuideRequest({ ...valid, propertySlug: 42 })).toEqual({ ok: false, error: 'Invalid property' })
    expect(parseGuideRequest(null)).toEqual({ ok: false, error: 'Invalid body' })
    expect(parseGuideRequest([])).toEqual({ ok: false, error: 'Invalid body' })
    expect(parseGuideRequest('{}')).toEqual({ ok: false, error: 'Invalid body' })
  })

  it('treats an empty slug as no slug', () => {
    const r = parseGuideRequest({ ...valid, propertySlug: '' })
    expect(r.ok && r.value.propertySlug).toBeUndefined()
  })
})

describe('guideLeadInput', () => {
  const now = new Date('2026-09-22T12:00:00.000Z')

  it('is a form lead of type guide_download in the guide placement, carrying only the email', () => {
    expect(LEAD_TYPES).toContain('guide_download')
    expect(LEAD_PLACEMENTS).toContain('guide')
    const input = guideLeadInput({ locale: 'pl', email: 'jan@example.pl', propertySlug: 'studio-plazh' }, { country: 'PL', now })
    expect(input).toEqual({
      type: 'guide_download',
      placement: 'guide',
      locale: 'pl',
      country: 'PL',
      propertySlug: 'studio-plazh',
      contact: { email: 'jan@example.pl' },
      formLabel: 'durres-buying-guide',
      now,
    })
  })

  it('builds a Sanity document with the journey, the listing and the email', () => {
    const ctx = sampleContext({ locale: 'pl' })
    const input = guideLeadInput({ locale: 'pl', email: 'jan@example.pl' }, { context: ctx, now })
    const doc = buildLeadDocument({ ...input, property: { id: 'prop1', slug: 'studio-plazh', title: 'Студия Пляж' } })
    expect(doc._type).toBe('lead')
    expect(doc.type).toBe('guide_download')
    expect(doc.status).toBe('new')
    expect(doc.placement).toBe('guide')
    expect(doc.locale).toBe('pl')
    expect(doc.email).toBe('jan@example.pl')
    expect(doc.name).toBeUndefined()
    expect(doc.phone).toBeUndefined()
    expect(doc.formLabel).toBe('durres-buying-guide')
    expect(doc.property).toEqual({ _type: 'reference', _ref: 'prop1', _weak: true })
    expect(doc.propertySlug).toBe('studio-plazh')
    expect(doc.source).toBe('google')
    expect(doc.pagesViewedCount).toBe(3)
    expect(doc.createdAt).toBe('2026-09-22T12:00:00.000Z')
  })
})

describe('formatGuideLeadTelegram', () => {
  it('names the guide, the email, the page and the listing, then the analytics block', () => {
    const text = formatGuideLeadTelegram({
      email: 'jan@example.pl',
      guideTitle: 'Buying in Durrës (PL)',
      context: sampleContext(),
      country: 'PL',
      locale: 'pl',
      property: { slug: 'studio-plazh', title: 'Студия Пляж', url: 'https://www.domlivo.com/pl/property/studio-plazh' },
    })
    const lines = text.split('\n')
    expect(lines.slice(0, 7)).toEqual([
      '📘 Лид скачал PDF-гид',
      '',
      'Гид: Buying in Durrës (PL)',
      'Email: jan@example.pl',
      'Страница: /ru/property/studio-plazh',
      'Объект: Студия Пляж (studio-plazh)',
      'https://www.domlivo.com/pl/property/studio-plazh',
    ])
    expect(text).toContain('📊 Аналитика')
    expect(text).toContain('Страна: PL')
  })

  it('prefixes internal traffic', () => {
    const text = formatGuideLeadTelegram({ email: 'x@y.z', guideTitle: 'G', context: sampleContext({ internal: true }) })
    expect(text.startsWith('[ТЕСТ] 📘')).toBe(true)
  })
})
