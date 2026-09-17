import { describe, expect, it } from 'vitest'
import { classifyDevice, classifyTraffic } from './trafficSource'

const base = { referrerHost: '', selfHost: 'www.domlivo.com', hasGclid: false }

describe('classifyTraffic', () => {
  it('reads no referrer as direct', () => {
    expect(classifyTraffic(base)).toEqual({ source: '(direct)', medium: '(none)', channel: 'direct' })
  })

  it('treats our own host as direct, not a referral', () => {
    expect(classifyTraffic({ ...base, referrerHost: 'domlivo.com' }).channel).toBe('direct')
    expect(classifyTraffic({ ...base, referrerHost: 'www.domlivo.com' }).channel).toBe('direct')
  })

  it.each([
    ['www.google.com', 'google'],
    ['www.google.co.uk', 'google'],
    ['google.al', 'google'],
    ['www.bing.com', 'bing'],
    ['duckduckgo.com', 'duckduckgo'],
    ['yandex.ru', 'yandex'],
    ['search.yahoo.com', 'yahoo'],
    ['www.qwant.com', 'qwant'],
    ['www.ecosia.org', 'ecosia'],
  ])('%s is organic search from %s', (host, source) => {
    expect(classifyTraffic({ ...base, referrerHost: host })).toEqual({
      source,
      medium: 'organic',
      channel: 'organic_search',
    })
  })

  it.each([
    ['chatgpt.com', 'chatgpt'],
    ['perplexity.ai', 'perplexity'],
    ['www.perplexity.ai', 'perplexity'],
    ['copilot.microsoft.com', 'copilot'],
    ['gemini.google.com', 'gemini'],
    ['claude.ai', 'claude'],
  ])('%s is an AI assistant', (host, source) => {
    expect(classifyTraffic({ ...base, referrerHost: host })).toEqual({ source, medium: 'referral', channel: 'ai' })
  })

  it.each([
    ['www.threads.net', 'threads'],
    ['l.instagram.com', 'instagram'],
    ['lm.facebook.com', 'facebook'],
    ['t.me', 'telegram'],
    ['web.telegram.org', 'telegram'],
    ['www.tiktok.com', 'tiktok'],
    ['www.linkedin.com', 'linkedin'],
  ])('%s is social', (host, source) => {
    expect(classifyTraffic({ ...base, referrerHost: host })).toEqual({ source, medium: 'social', channel: 'social' })
  })

  it('any other host is a referral named by its host', () => {
    expect(classifyTraffic({ ...base, referrerHost: 'www.albania-forum.de' })).toEqual({
      source: 'albania-forum.de',
      medium: 'referral',
      channel: 'referral',
    })
  })

  it('does not mistake a lookalike host for a search engine', () => {
    expect(classifyTraffic({ ...base, referrerHost: 'notgoogle.com' }).channel).toBe('referral')
  })

  it('lets UTMs override the referrer', () => {
    expect(
      classifyTraffic({
        ...base,
        referrerHost: 'www.google.com',
        utmSource: 'Newsletter',
        utmMedium: 'email',
        utmCampaign: 'sept',
      })
    ).toEqual({ source: 'newsletter', medium: 'email', channel: 'email', campaign: 'sept' })
  })

  it('classifies utm_source=chatgpt.com (added by ChatGPT) as AI', () => {
    expect(classifyTraffic({ ...base, utmSource: 'chatgpt.com' })).toEqual({
      source: 'chatgpt.com',
      medium: '(not set)',
      channel: 'ai',
    })
  })

  it('classifies paid UTMs on a search engine as paid search', () => {
    expect(classifyTraffic({ ...base, utmSource: 'google', utmMedium: 'cpc' }).channel).toBe('paid_search')
  })

  it('classifies social UTMs', () => {
    expect(classifyTraffic({ ...base, utmSource: 'instagram', utmMedium: 'story' }).channel).toBe('social')
  })

  it('reads a gclid without UTMs as Google Ads', () => {
    expect(classifyTraffic({ ...base, referrerHost: 'www.google.com', hasGclid: true })).toEqual({
      source: 'google',
      medium: 'cpc',
      channel: 'paid_search',
    })
  })
})

describe('classifyDevice', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
  const androidPhone = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36'
  const androidTablet = 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/126 Safari/537.36'
  const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'
  const windows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'

  it('detects phones and tablets from the UA', () => {
    expect(classifyDevice(390, iphone)).toBe('mobile')
    expect(classifyDevice(412, androidPhone)).toBe('mobile')
    expect(classifyDevice(1024, androidTablet)).toBe('tablet')
  })

  it('detects an iPad asking for the desktop site by its touch screen', () => {
    expect(classifyDevice(1024, mac, 5)).toBe('tablet')
    expect(classifyDevice(1440, mac, 0)).toBe('desktop')
  })

  it('keeps a narrow desktop window a desktop', () => {
    expect(classifyDevice(600, windows)).toBe('desktop')
  })

  it('uses width for an unknown UA', () => {
    expect(classifyDevice(360, 'SomeBrowser/1.0')).toBe('mobile')
    expect(classifyDevice(1280, 'SomeBrowser/1.0')).toBe('desktop')
  })
})
