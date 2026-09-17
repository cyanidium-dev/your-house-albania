import { describe, expect, it } from 'vitest'
import { buildLeadDocument, countryFromHeaders } from './buildLeadDocument'
import { sampleContext } from './testFixtures'

const now = new Date('2026-09-17T10:04:35.000Z')

describe('buildLeadDocument', () => {
  it('shapes a property inquiry with journey and contact fields', () => {
    const doc = buildLeadDocument({
      type: 'property_inquiry',
      placement: 'property',
      locale: 'ru',
      context: sampleContext(),
      country: 'DE',
      property: { id: 'drafts.abc123', slug: 'studio-plazh', title: 'Студия Пляж' },
      agent: { id: 'agent-1', slug: 'anna' },
      contact: { name: 'Ivan', phone: '+49 151 000', email: 'ivan@example.com', message: 'Is it available?' },
      now,
    })

    expect(doc).toEqual({
      _type: 'lead',
      type: 'property_inquiry',
      status: 'new',
      internal: false,
      createdAt: '2026-09-17T10:04:35.000Z',
      placement: 'property',
      locale: 'ru',
      property: { _type: 'reference', _ref: 'abc123', _weak: true },
      propertySlug: 'studio-plazh',
      propertyTitle: 'Студия Пляж',
      agent: { _type: 'reference', _ref: 'agent-1', _weak: true },
      agentSlug: 'anna',
      source: 'google',
      medium: 'organic',
      channel: 'organic_search',
      hasGclid: false,
      referrerHost: 'google.com',
      landingPage: '/ru/albania/durres/apartments',
      firstTouch: {
        source: 'instagram',
        medium: 'social',
        channel: 'social',
        landingPage: '/ru',
        referrerHost: 'l.instagram.com',
        at: '2026-09-10T08:15:00.000Z',
      },
      currentPage: '/ru/property/studio-plazh',
      pagesViewed: [
        { _key: 'p0', _type: 'pageVisit', path: '/ru/albania/durres/apartments', title: 'Квартиры в Дурресе' },
        { _key: 'p1', _type: 'pageVisit', path: '/ru/property/sea-view-apartment-durres', title: 'Квартира с видом на море' },
        { _key: 'p2', _type: 'pageVisit', path: '/ru/property/studio-plazh', title: 'Студия Пляж' },
      ],
      pagesViewedCount: 3,
      propertySlugsViewed: ['sea-view-apartment-durres', 'studio-plazh'],
      timeOnSiteSec: 275,
      country: 'DE',
      device: 'mobile',
      browserLanguage: 'ru-RU',
      name: 'Ivan',
      phone: '+49 151 000',
      email: 'ivan@example.com',
      message: 'Is it available?',
    })
  })

  it('never stores contact fields on a click lead', () => {
    const doc = buildLeadDocument({
      type: 'click_whatsapp',
      placement: 'footer',
      context: sampleContext(),
      contact: { name: 'x', phone: 'y' },
      now,
    })
    expect(doc).not.toHaveProperty('name')
    expect(doc).not.toHaveProperty('phone')
    expect(doc.locale).toBe('ru')
  })

  it('marks internal traffic as spam', () => {
    const doc = buildLeadDocument({
      type: 'click_phone',
      context: sampleContext({ internal: true }),
      now,
    })
    expect(doc.status).toBe('spam')
    expect(doc.internal).toBe(true)
  })

  it('keeps UTM fields together and works without a context', () => {
    const ctx = sampleContext()
    const withUtm = buildLeadDocument({
      type: 'contact_form',
      context: { ...ctx, session: { ...ctx.session, utmSource: 'fb', utmCampaign: 'autumn' } },
      now,
    })
    expect(withUtm.utm).toEqual({ source: 'fb', campaign: 'autumn' })

    const bare = buildLeadDocument({ type: 'contact_form', contact: { phone: '+355' }, now })
    expect(bare).toEqual({
      _type: 'lead',
      type: 'contact_form',
      status: 'new',
      internal: false,
      createdAt: '2026-09-17T10:04:35.000Z',
      phone: '+355',
    })
  })
})

describe('countryFromHeaders', () => {
  it('reads the Vercel geo header only', () => {
    expect(countryFromHeaders(new Headers({ 'x-vercel-ip-country': 'al' }))).toBe('AL')
    expect(countryFromHeaders(new Headers({ 'x-forwarded-for': '1.2.3.4' }))).toBeUndefined()
    expect(countryFromHeaders(new Headers({ 'x-vercel-ip-country': 'XXX' }))).toBeUndefined()
  })
})
