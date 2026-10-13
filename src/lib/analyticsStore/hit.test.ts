import { describe, expect, it } from 'vitest'
import { ensureSchema, SCHEMA_STATEMENTS, type SqlClient, type Statement } from './db'
import { buildHitRow, cleanLabel, createHitThrottle, hitStatements, parseHit, recordHit } from './hit'
import { fakeSql } from './testSql'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36'

describe('parseHit', () => {
  it('accepts what the browser sends', () => {
    expect(
      parseHit({ path: '/en/property/x/', entry: true, source: 'google', medium: 'organic', campaign: '' })
    ).toEqual({ path: '/en/property/x', entry: true, source: 'google', medium: 'organic', campaign: '' })
  })

  it('drops a hit without a usable path', () => {
    expect(parseHit({ path: 'https://evil.example/', entry: true })).toBeNull()
    expect(parseHit({ entry: true, source: 'google' })).toBeNull()
    expect(parseHit(null)).toBeNull()
    expect(parseHit([])).toBeNull()
    expect(parseHit('/en')).toBeNull()
  })

  it('treats only a literal true as a visit start', () => {
    expect(parseHit({ path: '/en', entry: 'true' })?.entry).toBe(false)
    expect(parseHit({ path: '/en', entry: 1 })?.entry).toBe(false)
  })

  it('fills missing labels instead of storing empty sources', () => {
    expect(parseHit({ path: '/en' })).toMatchObject({ source: '(unknown)', medium: '(not set)', campaign: '' })
    expect(parseHit({ path: '/en', source: 42, medium: {} })).toMatchObject({ source: '(unknown)', medium: '(not set)' })
  })

  it('caps and cleans labels from the browser', () => {
    const hit = parseHit({
      path: '/en',
      source: `Evil<script>${'x'.repeat(200)}`,
      medium: 'Social\n\u0000',
      campaign: 'Осенняя акция; DROP TABLE',
    })!
    expect(hit.source.length).toBeLessThanOrEqual(80)
    expect(hit.source).not.toMatch(/[<>]/)
    expect(hit.medium).toBe('social')
    expect(hit.campaign).toBe('осенняя акция_ drop table')
  })
})

describe('cleanLabel', () => {
  it('keeps the shapes real sources take', () => {
    expect(cleanLabel('(direct)', 80)).toBe('(direct)')
    expect(cleanLabel('l.facebook.com', 80)).toBe('l.facebook.com')
    expect(cleanLabel('PWA-Shortcut', 80)).toBe('pwa-shortcut')
  })
})

describe('buildHitRow', () => {
  const now = new Date('2026-10-13T23:59:00Z')

  it('adds the coarse context the server sees, and nothing identifying', () => {
    const row = buildHitRow(parseHit({ path: '/de/property/x', entry: true, source: 'google', medium: 'organic' })!, {
      userAgent: IPHONE,
      country: 'al',
      now,
    })
    expect(row).toEqual({
      path: '/de/property/x',
      entry: true,
      source: 'google',
      medium: 'organic',
      campaign: '',
      day: '2026-10-13',
      locale: 'de',
      device: 'mobile',
      country: 'AL',
    })
    expect(JSON.stringify(row)).not.toContain('iPhone')
  })

  it('leaves the country empty when the header is missing or odd', () => {
    const hit = parseHit({ path: '/' })!
    expect(buildHitRow(hit, { userAgent: DESKTOP, now }).country).toBe('')
    expect(buildHitRow(hit, { userAgent: DESKTOP, country: 'XXX', now }).country).toBe('')
    expect(buildHitRow(hit, { userAgent: DESKTOP, now }).device).toBe('desktop')
    expect(buildHitRow(hit, { userAgent: DESKTOP, now }).locale).toBe('')
  })
})

describe('hitStatements / recordHit', () => {
  const now = new Date('2026-10-13T08:00:00Z')

  it('counts a visit and a page view for the first page of a visit', async () => {
    const row = buildHitRow(parseHit({ path: '/en', entry: true, source: 'telegram', medium: 'messenger', campaign: 'oct' })!, {
      userAgent: DESKTOP,
      country: 'DE',
      now,
    })
    const sql = fakeSql()
    await recordHit(sql.client, row)
    expect(sql.transactions).toHaveLength(1)
    const [visit, view] = sql.transactions[0]
    expect(visit.text).toMatch(/INSERT INTO visit_daily/)
    expect(visit.text).toMatch(/visits = visit_daily\.visits \+ 1/)
    expect(visit.params).toEqual(['2026-10-13', '/en', 'telegram', 'messenger', 'oct', 'en', 'desktop', 'DE'])
    expect(view.text).toMatch(/INSERT INTO pageview_daily/)
    expect(view.params).toEqual(['2026-10-13', '/en', 'en'])
  })

  it('counts only a page view further into the visit', () => {
    const row = buildHitRow(parseHit({ path: '/en/catalog', entry: false })!, { userAgent: DESKTOP, now })
    const statements = hitStatements(row)
    expect(statements).toHaveLength(1)
    expect(statements[0].text).toMatch(/pageview_daily/)
  })

  it('never puts a value into the SQL text', () => {
    const row = buildHitRow(parseHit({ path: "/en/o'brien", entry: true, source: "x'); DROP TABLE visit_daily; --" })!, {
      userAgent: DESKTOP,
      now,
    })
    for (const s of hitStatements(row)) {
      expect(s.text).not.toContain('DROP')
      expect(s.text).not.toContain('brien')
    }
  })
})

describe('createHitThrottle', () => {
  it('lets a person through and stops a loop', () => {
    const allow = createHitThrottle({ windowMs: 1000, maxHits: 3, maxEntries: 1 })
    expect(allow('1.2.3.4', true, 0)).toBe(true)
    expect(allow('1.2.3.4', true, 1)).toBe(false)
    expect(allow('1.2.3.4', false, 2)).toBe(true)
    expect(allow('1.2.3.4', false, 3)).toBe(true)
    expect(allow('1.2.3.4', false, 4)).toBe(false)
    expect(allow('5.6.7.8', true, 5)).toBe(true)
    expect(allow('1.2.3.4', true, 1001)).toBe(true)
  })
})

describe('ensureSchema', () => {
  it('creates the schema once per client, in one round trip', async () => {
    const sql = fakeSql()
    await ensureSchema(sql.client)
    await ensureSchema(sql.client)
    expect(sql.transactions).toHaveLength(1)
    expect(sql.transactions[0].map((s) => s.text)).toEqual(SCHEMA_STATEMENTS)
    expect(SCHEMA_STATEMENTS.every((t) => /IF NOT EXISTS/.test(t))).toBe(true)
  })

  it('tries again after a failure instead of staying broken', async () => {
    let fail = true
    const seen: Statement[][] = []
    const client: SqlClient = {
      async query() {
        return []
      },
      async transaction(statements) {
        seen.push(statements)
        if (fail) throw new Error('cold start')
      },
    }
    await expect(ensureSchema(client)).rejects.toThrow('cold start')
    fail = false
    await ensureSchema(client)
    expect(seen).toHaveLength(2)
  })
})
