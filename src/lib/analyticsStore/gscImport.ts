/**
 * Nightly copy of Search Console's performance data into `gsc_daily`, one row
 * per day, page and query.
 *
 * Search Console keeps 16 months and only shows them in its own UI; a copy on
 * our side keeps the history past that and lets the panel put queries next to
 * our visits and Sanity leads for the same page.
 *
 * Two phases share one run and one time budget (the cron function has 60 s):
 *
 * 1. Catch-up: from three days before the newest stored day to two days ago
 *    (Search Console publishes final numbers with a lag). Re-imported days are
 *    overwritten, never added to.
 * 2. Backfill: while the 16-month history is incomplete, one calendar month at
 *    a time, newest first, until the budget runs out. Progress is a cursor in
 *    `import_log` (job `gsc-backfill`), so the next night carries on where this
 *    one stopped. Newest first means the panel's 7/28/90-day views fill up on
 *    the first night.
 *
 * A chunk is written only once all its pages are fetched: a half-fetched month
 * could move the newest stored day forward and hide the gap from the catch-up.
 */

import { addDays, ensureSchema, getSql, type SqlClient, type Statement, utcDay, writeImportLog } from './db'
import { fetchAccessToken, parseServiceAccount } from './gscAuth'
import { normalizePath } from './paths'

export const GSC_ROW_LIMIT = 25_000
const DEFAULT_SITE = 'sc-domain:domlivo.com'
const DEFAULT_BUDGET_MS = 40_000
/** Do not start a month with less than this left: it would only be thrown away. */
const MIN_CHUNK_MS = 8_000
const UPSERT_BATCH = 2_000
const MAX_QUERY = 300

export type DateRange = { start: string; end: string }

/** One row of `searchAnalytics.query` with dimensions `[date, page, query]`. */
export type GscApiRow = { keys?: unknown[]; clicks?: number; impressions?: number; position?: number }

export type GscRow = {
  day: string
  page: string
  query: string
  clicks: number
  impressions: number
  /** `position × impressions`, so averages over any grouping stay exact. */
  positionWeighted: number
}

export type GscImportResult =
  | { status: 'skipped'; reason: string }
  | {
      status: 'ok'
      rows: number
      catchUp: string[]
      backfill: string[]
      backfillDone: boolean
      timedOut: boolean
    }

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Hosts whose pages belong to the property. A domain property
 * (`sc-domain:domlivo.com`) reports the apex and `www`; anything else on the
 * domain (a Studio subdomain) would otherwise merge into the site's paths.
 */
export function siteHosts(siteUrl: string): string[] {
  let host = ''
  if (siteUrl.startsWith('sc-domain:')) host = siteUrl.slice('sc-domain:'.length)
  else {
    try {
      host = new URL(siteUrl).host
    } catch {
      host = ''
    }
  }
  host = host.trim().toLowerCase().replace(/^www\./, '')
  return host ? [host, `www.${host}`] : []
}

/** The stored path for a page URL Search Console reports, or `null` for another host. */
export function gscPagePath(url: unknown, hosts: string[]): string | null {
  if (typeof url !== 'string') return null
  try {
    const u = new URL(url)
    if (hosts.length > 0 && !hosts.includes(u.host.toLowerCase())) return null
    return normalizePath(u.pathname)
  } catch {
    return null
  }
}

function cleanQuery(v: unknown): string {
  if (typeof v !== 'string') return ''
  let out = ''
  for (const ch of v) {
    const code = ch.charCodeAt(0)
    // Postgres text cannot hold NUL; other control characters are noise.
    out += code < 32 || code === 127 ? ' ' : ch
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY)
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0
}

/**
 * API rows → store rows, summed by (day, page, query). Summing is needed, not
 * cosmetic: the apex and `www` versions of a URL become the same path, and one
 * upsert statement cannot touch the same key twice.
 */
export function aggregateGscRows(rows: GscApiRow[], hosts: string[], into = new Map<string, GscRow>()): Map<string, GscRow> {
  for (const r of rows) {
    const [date, url, q] = Array.isArray(r.keys) ? r.keys : []
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    const page = gscPagePath(url, hosts)
    const query = cleanQuery(q)
    if (!page || !query) continue
    const impressions = Math.round(num(r.impressions))
    const clicks = Math.round(num(r.clicks))
    const key = `${date}\u0000${page}\u0000${query}`
    const prev = into.get(key)
    const weighted = num(r.position) * impressions
    if (prev) {
      prev.clicks += clicks
      prev.impressions += impressions
      prev.positionWeighted += weighted
    } else {
      into.set(key, { day: date, page, query, clicks, impressions, positionWeighted: weighted })
    }
  }
  return into
}

/**
 * Upserts that overwrite: a day imported again replaces its numbers. Rows go in
 * as arrays through `unnest`, so a batch is one statement with six parameters
 * however many rows it holds.
 */
export function gscUpsertStatements(rows: GscRow[], batchSize = UPSERT_BATCH): Statement[] {
  const out: Statement[] = []
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    out.push({
      text: `INSERT INTO gsc_daily (day, page, query, clicks, impressions, position_weighted)
        SELECT * FROM unnest($1::date[], $2::text[], $3::text[], $4::int[], $5::int[], $6::real[])
        ON CONFLICT (day, page, query) DO UPDATE SET
          clicks = EXCLUDED.clicks,
          impressions = EXCLUDED.impressions,
          position_weighted = EXCLUDED.position_weighted`,
      params: [
        batch.map((r) => r.day),
        batch.map((r) => r.page),
        batch.map((r) => r.query),
        batch.map((r) => r.clicks),
        batch.map((r) => r.impressions),
        batch.map((r) => Math.round(r.positionWeighted * 100) / 100),
      ],
    })
  }
  return out
}

function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`
}

function monthEnd(day: string): string {
  const [y, m] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

/** `[start, end]` (inclusive) cut at calendar-month boundaries, oldest first. */
export function monthChunks(start: string, end: string): DateRange[] {
  const out: DateRange[] = []
  let s = start
  while (s <= end) {
    const e = monthEnd(s) < end ? monthEnd(s) : end
    out.push({ start: s, end: e })
    s = addDays(e, 1)
  }
  return out
}

/**
 * The backfill month just before `cursor` (an exclusive upper bound), clipped
 * at `floor`; `null` when the history is complete.
 */
export function backfillChunk(cursor: string, floor: string): DateRange | null {
  if (cursor <= floor) return null
  const end = addDays(cursor, -1)
  const start = monthStart(end) > floor ? monthStart(end) : floor
  return { start, end }
}

/**
 * The importable window on a given night: Search Console's data ends about
 * two days back and starts 16 months before that.
 */
export function importWindow(now: Date): { floor: string; end: string } {
  const end = addDays(utcDay(now), -2)
  const d = new Date(`${end}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() - 16)
  return { floor: addDays(d.toISOString().slice(0, 10), 1), end }
}

export type BackfillState = { cursor?: string; done: boolean }

export function parseBackfillState(detail: string | null | undefined): BackfillState {
  if (!detail) return { done: false }
  try {
    const j = JSON.parse(detail) as { cursor?: unknown; done?: unknown }
    const cursor = typeof j.cursor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(j.cursor) ? j.cursor : undefined
    return { ...(cursor ? { cursor } : {}), done: j.done === true }
  } catch {
    return { done: false }
  }
}

// ---------------------------------------------------------------------------
// The import
// ---------------------------------------------------------------------------

export type GscImportDeps = {
  sql: SqlClient | null
  serviceAccountJson: string | undefined
  siteUrl: string
  fetch: typeof fetch
  now: Date
  /** Milliseconds since an arbitrary origin; injectable so tests control time. */
  clock: () => number
  budgetMs: number
}

function defaultDeps(): GscImportDeps {
  return {
    sql: getSql(),
    serviceAccountJson: process.env.GSC_SERVICE_ACCOUNT_JSON,
    siteUrl: process.env.GSC_SITE_URL?.trim() || DEFAULT_SITE,
    fetch,
    now: new Date(),
    clock: Date.now,
    budgetMs: DEFAULT_BUDGET_MS,
  }
}

export function gscConfigured(): boolean {
  return parseServiceAccount(process.env.GSC_SERVICE_ACCOUNT_JSON) !== null
}

export function gscSiteUrl(): string {
  return process.env.GSC_SITE_URL?.trim() || DEFAULT_SITE
}

class OutOfTime extends Error {}

/** Every page of one date range, or `OutOfTime` when the budget ends mid-way. */
async function fetchRange(
  deps: GscImportDeps,
  token: string,
  range: DateRange,
  deadline: number
): Promise<GscApiRow[]> {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(deps.siteUrl)}/searchAnalytics/query`
  const rows: GscApiRow[] = []
  for (let startRow = 0; ; startRow += GSC_ROW_LIMIT) {
    const left = deadline - deps.clock()
    if (left <= 0) throw new OutOfTime()
    const res = await deps.fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: range.start,
        endDate: range.end,
        dimensions: ['date', 'page', 'query'],
        type: 'web',
        dataState: 'final',
        rowLimit: GSC_ROW_LIMIT,
        startRow,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(Math.max(1000, left)),
    })
    const json = (await res.json().catch(() => ({}))) as { rows?: GscApiRow[]; error?: { message?: string } }
    if (!res.ok) {
      throw new Error(`Search Console ${res.status}: ${json.error?.message ?? 'request failed'}`.slice(0, 300))
    }
    const page = Array.isArray(json.rows) ? json.rows : []
    rows.push(...page)
    if (page.length < GSC_ROW_LIMIT) return rows
  }
}

async function importRange(
  deps: GscImportDeps,
  sql: SqlClient,
  token: string,
  hosts: string[],
  range: DateRange,
  deadline: number
): Promise<number> {
  const apiRows = await fetchRange(deps, token, range, deadline)
  const rows = [...aggregateGscRows(apiRows, hosts).values()]
  for (const s of gscUpsertStatements(rows)) await sql.query(s.text, s.params)
  return rows.length
}

/**
 * The nightly job. Never throws for a missing configuration — that is the
 * normal state until the owner connects things — and logs every real run,
 * successful or not, to `import_log`.
 */
export async function runSearchConsoleImport(overrides: Partial<GscImportDeps> = {}): Promise<GscImportResult> {
  const deps = { ...defaultDeps(), ...overrides }
  const { sql } = deps
  if (!sql) return { status: 'skipped', reason: 'no database' }
  const key = parseServiceAccount(deps.serviceAccountJson)
  if (!key) return { status: 'skipped', reason: 'Search Console not configured' }

  const deadline = deps.clock() + deps.budgetMs
  const hosts = siteHosts(deps.siteUrl)
  const catchUp: string[] = []
  const backfill: string[] = []
  let rows = 0
  let timedOut = false
  let backfillDone = false

  try {
    await ensureSchema(sql)
    const token = await fetchAccessToken(key, { fetch: deps.fetch, now: deps.now })
    const { floor, end } = importWindow(deps.now)

    const [maxRow] = await sql.query<{ max_day: string | null }>('SELECT max(day)::text AS max_day FROM gsc_daily')
    const [stateRow] = await sql.query<{ detail: string }>(
      `SELECT detail FROM import_log WHERE job = 'gsc-backfill' AND ok ORDER BY ran_at DESC, id DESC LIMIT 1`
    )
    const state = parseBackfillState(stateRow?.detail)
    backfillDone = state.done

    // 1. Catch-up on the days since the last import.
    const maxDay = maxRow?.max_day ?? null
    if (maxDay) {
      const from = addDays(maxDay, -3) > floor ? addDays(maxDay, -3) : floor
      for (const range of monthChunks(from, end)) {
        if (deadline - deps.clock() < MIN_CHUNK_MS) {
          timedOut = true
          break
        }
        const n = await importRange(deps, sql, token, hosts, range, deadline)
        rows += n
        catchUp.push(`${range.start}..${range.end}: ${n}`)
      }
    }

    // 2. Backfill, newest month first.
    if (!state.done && !timedOut) {
      let cursor = state.cursor ?? addDays(end, 1)
      for (let range = backfillChunk(cursor, floor); range; range = backfillChunk(cursor, floor)) {
        if (deadline - deps.clock() < MIN_CHUNK_MS) {
          timedOut = true
          break
        }
        const n = await importRange(deps, sql, token, hosts, range, deadline)
        rows += n
        cursor = range.start
        backfillDone = cursor <= floor
        backfill.push(`${range.start}..${range.end}: ${n}`)
        await writeImportLog(sql, 'gsc-backfill', true, JSON.stringify({ cursor, done: backfillDone, rows: n }))
      }
      if (!timedOut && !backfillDone) {
        // The cursor was already at the floor (the window moved past it): mark
        // the history complete so later nights skip this phase.
        backfillDone = true
        await writeImportLog(sql, 'gsc-backfill', true, JSON.stringify({ cursor, done: true, rows: 0 }))
      }
    }

    const result: GscImportResult = { status: 'ok', rows, catchUp, backfill, backfillDone, timedOut }
    await writeImportLog(sql, 'gsc', true, JSON.stringify({ rows, catchUp, backfill, backfillDone, timedOut }))
    return result
  } catch (err) {
    if (err instanceof OutOfTime || (err instanceof Error && err.name === 'TimeoutError')) {
      // The chunk in flight is dropped; everything before it is stored.
      const result: GscImportResult = { status: 'ok', rows, catchUp, backfill, backfillDone, timedOut: true }
      await writeImportLog(sql, 'gsc', true, JSON.stringify({ rows, catchUp, backfill, backfillDone, timedOut: true })).catch(() => {})
      return result
    }
    const message = err instanceof Error ? err.message : String(err)
    await writeImportLog(sql, 'gsc', false, message).catch(() => {})
    throw err
  }
}
