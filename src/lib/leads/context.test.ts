import { describe, expect, it } from 'vitest'
import { MAX_PAGES, cleanPath, parseLeadContext } from './context'
import { sampleContext } from './testFixtures'

describe('parseLeadContext', () => {
  it('round-trips a valid context', () => {
    const ctx = sampleContext()
    expect(parseLeadContext(JSON.parse(JSON.stringify(ctx)))).toEqual(ctx)
  })

  it('refuses anything without a session touch point', () => {
    expect(parseLeadContext(undefined)).toBeUndefined()
    expect(parseLeadContext('x')).toBeUndefined()
    expect(parseLeadContext({ ...sampleContext(), session: { source: 'google' } })).toBeUndefined()
  })

  it('rejects an unknown channel', () => {
    const ctx = sampleContext()
    expect(parseLeadContext({ ...ctx, session: { ...ctx.session, channel: 'hacker' } })).toBeUndefined()
  })

  it('drops bad pages, keeps good ones, caps the list', () => {
    const pages = Array.from({ length: 30 }, (_, i) => ({ path: `/ru/p${i}`, title: `T${i}` }))
    const parsed = parseLeadContext({
      ...sampleContext(),
      pagesViewed: [{ path: 'https://evil.example/x', title: 'x' }, { path: '//evil' }, 42, ...pages],
      pagesViewedCount: 2,
    })
    expect(parsed?.pagesViewed).toHaveLength(MAX_PAGES)
    expect(parsed?.pagesViewed.at(-1)).toEqual({ path: '/ru/p29', title: 'T29' })
    // The count never reads lower than the list it came with.
    expect(parsed?.pagesViewedCount).toBe(MAX_PAGES)
  })

  it('strips control characters and caps strings', () => {
    const ctx = sampleContext()
    const parsed = parseLeadContext({
      ...ctx,
      session: { ...ctx.session, campaign: `a${String.fromCharCode(10)}b${String.fromCharCode(0)}c${'x'.repeat(500)}` },
    })
    expect(parsed?.session.campaign?.startsWith('a b c')).toBe(true)
    expect(parsed?.session.campaign?.length).toBe(120)
  })

  it('degrades optional fields instead of failing', () => {
    const parsed = parseLeadContext({
      session: sampleContext().session,
      device: 'fridge',
      timeOnSiteSec: -5,
      propertySlugsViewed: ['ok-slug', 'Bad Slug', 'ok-slug'],
      internal: 'yes',
    })
    expect(parsed).toMatchObject({
      firstTouch: null,
      device: 'desktop',
      timeOnSiteSec: 0,
      propertySlugsViewed: ['ok-slug'],
      internal: false,
      currentPage: '/ru/albania/durres/apartments',
    })
  })
})

describe('cleanPath', () => {
  it('accepts same-site paths only', () => {
    expect(cleanPath('/ru/property/x')).toBe('/ru/property/x')
    expect(cleanPath('//evil.example')).toBeUndefined()
    expect(cleanPath('javascript:alert(1)')).toBeUndefined()
  })
})
