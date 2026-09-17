import { describe, expect, it } from 'vitest'
import { createClickThrottle, isLikelyBot } from './clickGuard'
import { parseClickLeadBody, propertyUrl } from './clickRequest'
import { sampleContext } from './testFixtures'
import { classifyContactHref } from './types'

describe('parseClickLeadBody', () => {
  it('accepts a full click', () => {
    const context = sampleContext()
    const res = parseClickLeadBody({
      type: 'click_whatsapp',
      placement: 'property',
      propertySlug: 'studio-plazh',
      locale: 'ru',
      context,
    })
    expect(res).toEqual({
      ok: true,
      value: { type: 'click_whatsapp', placement: 'property', propertySlug: 'studio-plazh', locale: 'ru', context },
    })
  })

  it('defaults the placement', () => {
    const res = parseClickLeadBody({ type: 'click_phone' })
    expect(res.ok && res.value.placement).toBe('page')
  })

  it.each([
    [{ type: 'click_fax' }, 'Invalid type'],
    [{ type: 'click_phone', placement: 'sidebar' }, 'Invalid placement'],
    [{ type: 'click_phone', propertySlug: '../etc' }, 'Invalid property'],
    [{ type: 'click_phone', locale: 'fr' }, 'Invalid locale'],
    [{ type: 'click_phone', context: { nope: true } }, 'Invalid context'],
    [{ type: 'click_phone', name: 'Ivan' }, 'Unexpected field: name'],
  ])('refuses %j', (body, error) => {
    expect(parseClickLeadBody(body)).toEqual({ ok: false, error })
  })

  it('refuses non-objects', () => {
    expect(parseClickLeadBody(null).ok).toBe(false)
    expect(parseClickLeadBody([]).ok).toBe(false)
  })
})

describe('propertyUrl', () => {
  it('builds a locale URL and falls back to English', () => {
    expect(propertyUrl('https://www.domlivo.com/', 'ru', 'x')).toBe('https://www.domlivo.com/ru/property/x')
    expect(propertyUrl('https://www.domlivo.com', 'xx', 'x')).toBe('https://www.domlivo.com/en/property/x')
  })
})

describe('classifyContactHref', () => {
  it.each([
    ['https://wa.me/355689286136', 'click_whatsapp'],
    ['https://api.whatsapp.com/send?phone=355', 'click_whatsapp'],
    ['whatsapp://send?phone=355', 'click_whatsapp'],
    ['tel:+355689286136', 'click_phone'],
    ['mailto:info@domlivo.com', 'click_email'],
    ['https://t.me/fedirdev', null],
    ['https://example.com/wa.me/123', null],
    ['/ru/contacts', null],
  ])('%s → %s', (href, expected) => {
    expect(classifyContactHref(href)).toBe(expected)
  })
})

describe('isLikelyBot', () => {
  it('flags crawlers, scripts and empty agents', () => {
    expect(isLikelyBot('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true)
    expect(isLikelyBot('curl/8.4.0')).toBe(true)
    expect(isLikelyBot('')).toBe(true)
    expect(isLikelyBot(null)).toBe(true)
  })

  it('lets browsers through', () => {
    expect(
      isLikelyBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')
    ).toBe(false)
  })
})

describe('createClickThrottle', () => {
  it('allows one click per client and type per window', () => {
    const allow = createClickThrottle(30_000)
    expect(allow('1.2.3.4', 'click_whatsapp', 0)).toBe(true)
    expect(allow('1.2.3.4', 'click_whatsapp', 10_000)).toBe(false)
    expect(allow('1.2.3.4', 'click_phone', 10_000)).toBe(true)
    expect(allow('5.6.7.8', 'click_whatsapp', 10_000)).toBe(true)
    expect(allow('1.2.3.4', 'click_whatsapp', 30_001)).toBe(true)
  })
})
