import { describe, expect, it } from 'vitest'
import {
  isoWeekNumber,
  isoWeekStart,
  landingRows,
  leadsByLanding,
  mergeSources,
  parseDays,
  rangeStart,
  topLeadLandings,
  weekRows,
  type PanelLead,
} from './aggregate'

const lead = (over: Partial<PanelLead>): PanelLead => ({
  type: 'click_whatsapp',
  source: 'google',
  medium: 'organic',
  landingPage: '/en',
  createdAt: '2026-10-07T10:00:00.000Z',
  ...over,
})

describe('range', () => {
  it('accepts only the offered ranges', () => {
    expect(parseDays('7')).toBe(7)
    expect(parseDays('90')).toBe(90)
    expect(parseDays(['28', '7'])).toBe(28)
    expect(parseDays('365')).toBe(28)
    expect(parseDays(undefined)).toBe(28)
  })

  it('counts today as the last day of the range', () => {
    expect(rangeStart(7, new Date('2026-10-13T12:00:00Z'))).toBe('2026-10-07')
    expect(rangeStart(28, new Date('2026-10-13T00:00:00Z'))).toBe('2026-09-16')
  })

  it('finds the Monday of an ISO week and its number', () => {
    expect(isoWeekStart('2026-10-13')).toBe('2026-10-12')
    expect(isoWeekStart('2026-10-12')).toBe('2026-10-12')
    expect(isoWeekStart('2026-10-18')).toBe('2026-10-12')
    expect(isoWeekNumber('2026-10-12')).toBe(42)
    expect(isoWeekNumber('2026-01-01')).toBe(1)
    expect(isoWeekNumber('2027-01-01')).toBe(53)
  })
})

describe('mergeSources', () => {
  it('puts leads next to the visits from the same source', () => {
    const rows = mergeSources(
      [
        { source: 'google', medium: 'organic', visits: 100 },
        { source: '(direct)', medium: '(none)', visits: 40 },
      ],
      [
        lead({ type: 'contact_form' }),
        lead({}),
        lead({ source: 'Telegram', medium: 'messenger' }),
        lead({ source: undefined, medium: undefined }),
      ]
    )
    expect(rows).toEqual([
      { source: 'google', medium: 'organic', visits: 100, leads: 2, forms: 1, conversion: 0.02 },
      { source: '(direct)', medium: '(none)', visits: 40, leads: 0, forms: 0, conversion: 0 },
      { source: '(unknown)', medium: '(unknown)', visits: 0, leads: 1, forms: 0, conversion: null },
      { source: 'telegram', medium: 'messenger', visits: 0, leads: 1, forms: 0, conversion: null },
    ])
  })

  it('works from Sanity alone, with visits unknown rather than zero', () => {
    const rows = mergeSources(null, [lead({})])
    expect(rows).toEqual([{ source: 'google', medium: 'organic', visits: null, leads: 1, forms: 0, conversion: null }])
  })
})

describe('landing pages', () => {
  const leads = [
    lead({ landingPage: '/en/property/x/' }),
    lead({ landingPage: '/en/property/x', type: 'property_inquiry' }),
    lead({ landingPage: '/de' }),
    lead({ landingPage: null }),
  ]

  it('groups leads by the normalised page their visit started on', () => {
    const by = leadsByLanding(leads)
    expect(by.get('/en/property/x')).toEqual({ leads: 2, forms: 1 })
    expect(topLeadLandings(by, 10)).toEqual(['/en/property/x', '/de', '(unknown)'])
  })

  it('joins visits and the page\'s own queries', () => {
    const by = leadsByLanding(leads)
    const rows = landingRows(
      ['/en/property/x', '/fr'],
      [{ path: '/en/property/x', visits: 50 }],
      by,
      [{ page: '/en/property/x', query: 'durres flat', clicks: 3, impressions: 90, position: 6.2 }]
    )
    expect(rows[0]).toEqual({
      path: '/en/property/x',
      visits: 50,
      leads: 2,
      forms: 1,
      queries: [{ page: '/en/property/x', query: 'durres flat', clicks: 3, impressions: 90, position: 6.2 }],
    })
    expect(rows[1]).toEqual({ path: '/fr', visits: 0, leads: 0, forms: 0, queries: [] })
    expect(landingRows(['/de'], null, by, null)[0]).toMatchObject({ visits: null, queries: null, leads: 1 })
  })
})

describe('weekRows', () => {
  it('lists every week in the range, with leads counted by creation week', () => {
    const rows = weekRows(
      '2026-09-30',
      '2026-10-13',
      [{ week: '2026-10-05', visits: 70, clicks: 9, impressions: 400 }],
      [lead({ createdAt: '2026-10-07T10:00:00Z' }), lead({ createdAt: '2026-10-13T08:00:00Z' }), lead({ createdAt: 'bad' })]
    )
    expect(rows).toEqual([
      { week: '2026-09-28', visits: 0, leads: 0, clicks: 0, impressions: 0 },
      { week: '2026-10-05', visits: 70, leads: 1, clicks: 9, impressions: 400 },
      { week: '2026-10-12', visits: 0, leads: 1, clicks: 0, impressions: 0 },
    ])
  })

  it('shows unknown visits and clicks without a database', () => {
    const [row] = weekRows('2026-10-12', '2026-10-13', null, [])
    expect(row).toEqual({ week: '2026-10-12', visits: null, leads: 0, clicks: null, impressions: null })
  })
})
