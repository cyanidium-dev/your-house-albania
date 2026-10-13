import { describe, expect, it } from 'vitest'
import { classifyTraffic } from '@/lib/analytics/trafficSource'
import { buildUtmLink, slugCampaign, UTM_PRESETS, type UtmPreset } from './utm'

/** What the site's attribution makes of a link when someone opens it. */
function arrival(link: string) {
  const u = new URL(link)
  return classifyTraffic({
    referrerHost: '',
    selfHost: 'www.domlivo.com',
    utmSource: u.searchParams.get('utm_source') ?? undefined,
    utmMedium: u.searchParams.get('utm_medium') ?? undefined,
    utmCampaign: u.searchParams.get('utm_campaign') ?? undefined,
    hasGclid: false,
  })
}

describe('buildUtmLink', () => {
  it('tags a link with source, medium and campaign', () => {
    const r = buildUtmLink('https://www.domlivo.com/en/catalog?city=durres', 'telegram', 'Sea view, October!')
    expect(r).toEqual({
      url: 'https://www.domlivo.com/en/catalog?city=durres&utm_source=telegram&utm_medium=messenger&utm_campaign=sea-view-october',
    })
  })

  it('replaces old tags and drops the internal flag', () => {
    const r = buildUtmLink(
      'https://domlivo.com/de?utm_source=old&utm_content=x&domlivo_internal=1&gclid=abc',
      'email',
      'digest'
    )
    expect('url' in r && r.url).toBe('https://domlivo.com/de?utm_source=email&utm_medium=email&utm_campaign=digest')
  })

  it('warns about other sites and a missing campaign, and refuses non-links', () => {
    expect(buildUtmLink('https://example.com/', 'facebook', 'x')).toMatchObject({ warning: expect.stringMatching(/not a domlivo/) })
    expect(buildUtmLink('https://www.domlivo.com/en', 'facebook', '')).toMatchObject({ warning: expect.stringMatching(/campaign/) })
    expect(buildUtmLink('domlivo.com/en', 'facebook', 'x')).toHaveProperty('error')
    expect(buildUtmLink('javascript:alert(1)', 'facebook', 'x')).toHaveProperty('error')
  })

  it('normalises campaign names, any script', () => {
    expect(slugCampaign('  Осень 2026 — Durrës  ')).toBe('осень-2026-durrës')
  })
})

describe('presets classify as intended on arrival', () => {
  const expected: Record<UtmPreset, string> = {
    telegram: 'social',
    whatsapp: 'social',
    instagram: 'social',
    facebook: 'social',
    linkedin: 'social',
    email: 'email',
  }
  for (const preset of Object.keys(UTM_PRESETS) as UtmPreset[]) {
    it(`${preset} → ${expected[preset]}`, () => {
      const r = buildUtmLink('https://www.domlivo.com/en', preset, 'test')
      if (!('url' in r)) throw new Error('no url')
      const a = arrival(r.url)
      expect(a.channel).toBe(expected[preset])
      expect(a.source).toBe(UTM_PRESETS[preset].source)
      expect(a.medium).toBe(UTM_PRESETS[preset].medium)
      expect(a.campaign).toBe('test')
    })
  }
})
