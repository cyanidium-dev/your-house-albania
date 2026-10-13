import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  aggregateGscRows,
  backfillChunk,
  GSC_ROW_LIMIT,
  gscPagePath,
  gscUpsertStatements,
  importWindow,
  monthChunks,
  parseBackfillState,
  runSearchConsoleImport,
  siteHosts,
  type GscApiRow,
} from './gscImport'
import { fakeSql } from './testSql'

const HOSTS = siteHosts('sc-domain:domlivo.com')

describe('siteHosts / gscPagePath', () => {
  it('covers the apex and www of a domain property', () => {
    expect(HOSTS).toEqual(['domlivo.com', 'www.domlivo.com'])
    expect(siteHosts('https://www.domlivo.com/')).toEqual(['domlivo.com', 'www.domlivo.com'])
  })

  it('keeps our pages and drops other hosts on the domain', () => {
    expect(gscPagePath('https://www.domlivo.com/en/catalog/', HOSTS)).toBe('/en/catalog')
    expect(gscPagePath('https://domlivo.com/', HOSTS)).toBe('/')
    expect(gscPagePath('https://studio.domlivo.com/desk', HOSTS)).toBeNull()
    expect(gscPagePath('nonsense', HOSTS)).toBeNull()
  })
})

describe('aggregateGscRows', () => {
  it('maps API rows to store rows, weighting position by impressions', () => {
    const rows = [...aggregateGscRows([
      { keys: ['2026-10-01', 'https://www.domlivo.com/en/property/x', 'durres apartment'], clicks: 2, impressions: 40, position: 7.5 },
    ], HOSTS).values()]
    expect(rows).toEqual([
      { day: '2026-10-01', page: '/en/property/x', query: 'durres apartment', clicks: 2, impressions: 40, positionWeighted: 300 },
    ])
  })

  it('sums rows that become the same page (apex and www, trailing slash)', () => {
    const rows = [...aggregateGscRows([
      { keys: ['2026-10-01', 'https://www.domlivo.com/en/', 'domlivo'], clicks: 3, impressions: 10, position: 1 },
      { keys: ['2026-10-01', 'https://domlivo.com/en', 'domlivo'], clicks: 1, impressions: 5, position: 3 },
    ], HOSTS).values()]
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ page: '/en', clicks: 4, impressions: 15, positionWeighted: 25 })
    // Average position over both: 25 / 15.
    expect(rows[0].positionWeighted / rows[0].impressions).toBeCloseTo(1.667, 3)
  })

  it('skips malformed rows and cleans queries', () => {
    const rows = [...aggregateGscRows([
      { keys: ['yesterday', 'https://www.domlivo.com/en', 'q'], clicks: 1, impressions: 1, position: 1 },
      { keys: ['2026-10-01', 'https://other.example/en', 'q'], clicks: 1, impressions: 1, position: 1 },
      { keys: ['2026-10-01', 'https://www.domlivo.com/en', '   '], clicks: 1, impressions: 1, position: 1 },
      { keys: ['2026-10-01'] },
      {},
      { keys: ['2026-10-01', 'https://www.domlivo.com/en', 'flat\u0000 in\n durres'], clicks: -1, impressions: Number.NaN },
    ] as GscApiRow[], HOSTS).values()]
    expect(rows).toEqual([
      { day: '2026-10-01', page: '/en', query: 'flat in durres', clicks: 0, impressions: 0, positionWeighted: 0 },
    ])
  })
})

describe('gscUpsertStatements', () => {
  const row = (i: number) => ({ day: '2026-10-01', page: '/en', query: `q${i}`, clicks: i, impressions: i * 10, positionWeighted: i * 1.234 })

  it('overwrites re-imported days instead of adding to them', () => {
    const [s] = gscUpsertStatements([row(1)])
    expect(s.text).toMatch(/ON CONFLICT \(day, page, query\) DO UPDATE SET/)
    expect(s.text).toMatch(/clicks = EXCLUDED\.clicks/)
    expect(s.text).not.toMatch(/gsc_daily\.clicks \+/)
  })

  it('sends rows as six parallel arrays through unnest, in batches', () => {
    const statements = gscUpsertStatements([row(1), row(2), row(3)], 2)
    expect(statements).toHaveLength(2)
    expect(statements[0].text).toMatch(/unnest\(\$1::date\[\], \$2::text\[\], \$3::text\[\], \$4::int\[\], \$5::int\[\], \$6::real\[\]\)/)
    expect(statements[0].params).toEqual([
      ['2026-10-01', '2026-10-01'],
      ['/en', '/en'],
      ['q1', 'q2'],
      [1, 2],
      [10, 20],
      [1.23, 2.47],
    ])
    expect(statements[1].params[2]).toEqual(['q3'])
  })
})

describe('date ranges', () => {
  it('cuts a range at calendar months, oldest first', () => {
    expect(monthChunks('2026-08-29', '2026-10-11')).toEqual([
      { start: '2026-08-29', end: '2026-08-31' },
      { start: '2026-09-01', end: '2026-09-30' },
      { start: '2026-10-01', end: '2026-10-11' },
    ])
    expect(monthChunks('2026-10-11', '2026-10-11')).toEqual([{ start: '2026-10-11', end: '2026-10-11' }])
    expect(monthChunks('2026-10-12', '2026-10-11')).toEqual([])
    expect(monthChunks('2024-02-20', '2024-03-02')).toEqual([
      { start: '2024-02-20', end: '2024-02-29' },
      { start: '2024-03-01', end: '2024-03-02' },
    ])
  })

  it('backfills the month before the cursor, clipped at the floor', () => {
    expect(backfillChunk('2026-10-12', '2025-06-12')).toEqual({ start: '2026-10-01', end: '2026-10-11' })
    expect(backfillChunk('2026-10-01', '2025-06-12')).toEqual({ start: '2026-09-01', end: '2026-09-30' })
    expect(backfillChunk('2025-07-01', '2025-06-12')).toEqual({ start: '2025-06-12', end: '2025-06-30' })
    expect(backfillChunk('2025-06-12', '2025-06-12')).toBeNull()
  })

  it('imports up to two days ago and back 16 months', () => {
    expect(importWindow(new Date('2026-10-13T03:30:00Z'))).toEqual({ floor: '2025-06-12', end: '2026-10-11' })
  })

  it('reads the backfill cursor defensively', () => {
    expect(parseBackfillState('{"cursor":"2026-08-01","done":false}')).toEqual({ cursor: '2026-08-01', done: false })
    expect(parseBackfillState('{"cursor":"x","done":true}')).toEqual({ done: true })
    expect(parseBackfillState('oops')).toEqual({ done: false })
    expect(parseBackfillState(undefined)).toEqual({ done: false })
  })
})

// ---------------------------------------------------------------------------
// The whole job against a fake database and a fake Google
// ---------------------------------------------------------------------------

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const KEY_JSON = JSON.stringify({
  client_email: 'reader@test.iam.gserviceaccount.com',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  token_uri: 'https://oauth2.googleapis.com/token',
})
const NOW = new Date('2026-10-13T03:30:00Z')

type GscCall = { startDate: string; endDate: string; startRow: number }

function harness(opts: {
  maxDay?: string | null
  backfill?: string
  msPerCall?: number
  rowsFor?: (call: GscCall) => GscApiRow[]
  gscStatus?: number
}) {
  let t = 0
  const gscCalls: GscCall[] = []
  const sql = fakeSql((text) => {
    if (text.includes('max(day)')) return [{ max_day: opts.maxDay ?? null }]
    if (text.includes("job = 'gsc-backfill'")) return opts.backfill ? [{ detail: opts.backfill }] : []
    return []
  })
  const fakeFetch = (async (url: string, init: RequestInit) => {
    if (url.startsWith('https://oauth2.googleapis.com/')) {
      return new Response(JSON.stringify({ access_token: 'token' }), { status: 200 })
    }
    expect(url).toBe('https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Adomlivo.com/searchAnalytics/query')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token')
    const body = JSON.parse(String(init.body))
    expect(body).toMatchObject({ dimensions: ['date', 'page', 'query'], dataState: 'final', rowLimit: GSC_ROW_LIMIT })
    const call = { startDate: body.startDate, endDate: body.endDate, startRow: body.startRow }
    gscCalls.push(call)
    t += opts.msPerCall ?? 100
    if (opts.gscStatus && opts.gscStatus !== 200) {
      return new Response(JSON.stringify({ error: { message: 'User does not have sufficient permission' } }), {
        status: opts.gscStatus,
      })
    }
    const rows = opts.rowsFor?.(call) ?? [
      { keys: [call.endDate, 'https://www.domlivo.com/en/', 'domlivo'], clicks: 1, impressions: 2, position: 3 },
    ]
    return new Response(JSON.stringify({ rows }), { status: 200 })
  }) as unknown as typeof fetch

  const run = (budgetMs = 40_000) =>
    runSearchConsoleImport({
      sql: sql.client,
      serviceAccountJson: KEY_JSON,
      siteUrl: 'sc-domain:domlivo.com',
      fetch: fakeFetch,
      now: NOW,
      clock: () => t,
      budgetMs,
    })
  const logs = () =>
    sql.calls
      .filter((c) => c.text.startsWith('INSERT INTO import_log'))
      .map((c) => ({ job: c.params[0], ok: c.params[1], detail: String(c.params[2]) }))
  const upserts = () => sql.calls.filter((c) => c.text.includes('INSERT INTO gsc_daily'))
  return { sql, gscCalls, run, logs, upserts }
}

describe('runSearchConsoleImport', () => {
  it('skips quietly until things are connected', async () => {
    await expect(runSearchConsoleImport({ sql: null })).resolves.toEqual({ status: 'skipped', reason: 'no database' })
    const sql = fakeSql()
    await expect(runSearchConsoleImport({ sql: sql.client, serviceAccountJson: undefined })).resolves.toEqual({
      status: 'skipped',
      reason: 'Search Console not configured',
    })
    expect(sql.calls).toHaveLength(0)
  })

  it('backfills an empty table newest month first and records progress', async () => {
    const h = harness({})
    const result = await h.run()
    expect(result).toMatchObject({ status: 'ok', backfillDone: true, timedOut: false, rows: 17 })
    expect(h.gscCalls).toHaveLength(17)
    expect(h.gscCalls[0]).toEqual({ startDate: '2026-10-01', endDate: '2026-10-11', startRow: 0 })
    expect(h.gscCalls[1]).toEqual({ startDate: '2026-09-01', endDate: '2026-09-30', startRow: 0 })
    expect(h.gscCalls[16]).toEqual({ startDate: '2025-06-12', endDate: '2025-06-30', startRow: 0 })

    const backfillLogs = h.logs().filter((l) => l.job === 'gsc-backfill')
    expect(backfillLogs).toHaveLength(17)
    expect(JSON.parse(backfillLogs[0].detail)).toMatchObject({ cursor: '2026-10-01', done: false })
    expect(JSON.parse(backfillLogs[16].detail)).toMatchObject({ cursor: '2025-06-12', done: true })
    expect(h.logs().at(-1)).toMatchObject({ job: 'gsc', ok: true })

    // Stored as a path, origin and trailing slash gone.
    expect(h.upserts()[0].params[1]).toEqual(['/en'])
  })

  it('stops before the time budget and leaves the cursor at the last whole month', async () => {
    const h = harness({ msPerCall: 5_000 })
    const result = await h.run(20_000)
    expect(result).toMatchObject({ status: 'ok', timedOut: true, backfillDone: false })
    expect(h.gscCalls.map((c) => c.startDate)).toEqual(['2026-10-01', '2026-09-01', '2026-08-01'])
    const last = h.logs().filter((l) => l.job === 'gsc-backfill').at(-1)!
    expect(JSON.parse(last.detail)).toMatchObject({ cursor: '2026-08-01', done: false })
  })

  it('catches up on recent days, then carries the backfill on from its cursor', async () => {
    const h = harness({ maxDay: '2026-10-09', backfill: '{"cursor":"2026-08-01","done":false}' })
    await h.run()
    expect(h.gscCalls[0]).toEqual({ startDate: '2026-10-06', endDate: '2026-10-11', startRow: 0 })
    expect(h.gscCalls[1]).toEqual({ startDate: '2026-07-01', endDate: '2026-07-31', startRow: 0 })
  })

  it('only catches up once the history is complete', async () => {
    const h = harness({ maxDay: '2026-10-11', backfill: '{"cursor":"2025-06-11","done":true}' })
    const result = await h.run()
    expect(h.gscCalls).toEqual([{ startDate: '2026-10-08', endDate: '2026-10-11', startRow: 0 }])
    expect(result).toMatchObject({ status: 'ok', backfillDone: true, backfill: [] })
  })

  it('pages through a full response before writing the month', async () => {
    const h = harness({
      maxDay: '2026-10-11',
      backfill: '{"done":true}',
      rowsFor: (call) =>
        call.startRow === 0
          ? Array.from({ length: GSC_ROW_LIMIT }, (_, i) => ({
              keys: ['2026-10-10', 'https://www.domlivo.com/en', `q${i}`],
              clicks: 0,
              impressions: 1,
              position: 10,
            }))
          : [{ keys: ['2026-10-10', 'https://www.domlivo.com/en', 'last'], clicks: 1, impressions: 1, position: 1 }],
    })
    const result = await h.run()
    expect(h.gscCalls.map((c) => c.startRow)).toEqual([0, GSC_ROW_LIMIT])
    expect(result).toMatchObject({ rows: GSC_ROW_LIMIT + 1 })
    expect(h.upserts()).toHaveLength(Math.ceil((GSC_ROW_LIMIT + 1) / 2000))
  })

  it('logs a failure and lets the cron report it', async () => {
    const h = harness({ gscStatus: 403 })
    await expect(h.run()).rejects.toThrow('Search Console 403: User does not have sufficient permission')
    expect(h.logs().at(-1)).toMatchObject({ job: 'gsc', ok: false })
    expect(h.upserts()).toHaveLength(0)
  })
})
