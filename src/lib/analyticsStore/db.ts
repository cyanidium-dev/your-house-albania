/**
 * Our own analytics database: a small Postgres (Neon, free tier) that keeps
 * daily aggregates of visits, page views and Search Console rows.
 *
 * Why a database at all: GA4 sees a few percent of visits because of the
 * consent banner, Clarity splits every page into its own "session", and Search
 * Console forgets everything after 16 months. Counting on our side, without
 * cookies or anything that identifies a person, gives numbers the owner can
 * compare with the leads in Sanity.
 *
 * Every table is an aggregate — one row per day and combination of dimensions —
 * so the free tier never fills up with raw events, and nothing in here can be
 * traced back to a visitor.
 *
 * Nothing is required: without `DATABASE_URL` (or `POSTGRES_URL`, which
 * Vercel's Neon integration may set instead) `getSql()` returns `null` and
 * every caller treats that as "not connected yet".
 */

import { neon } from '@neondatabase/serverless'

/** One parameterised statement. Values are never interpolated into the text. */
export type Statement = { text: string; params: unknown[] }

/**
 * The slice of a SQL client the store uses. The Neon driver implements it in
 * production; tests pass a recorder, which is why nothing here imports the
 * driver directly except {@link getSql}.
 */
export interface SqlClient {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>
  /** Runs the statements in one round trip, as one transaction. */
  transaction(statements: Statement[]): Promise<void>
}

export function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim()
  return url || undefined
}

export function databaseConfigured(): boolean {
  return Boolean(databaseUrl())
}

let cached: { url: string; client: SqlClient } | null = null

/**
 * The SQL client for this instance, or `null` when no database is connected.
 * Neon's HTTP driver holds no connection, so one client per instance is cheap
 * and safe to share between requests.
 */
export function getSql(): SqlClient | null {
  const url = databaseUrl()
  if (!url) return null
  if (cached?.url === url) return cached.client
  const sql = neon(url)
  const client: SqlClient = {
    async query<T>(text: string, params: unknown[] = []) {
      return (await sql.query(text, params)) as T[]
    },
    async transaction(statements: Statement[]) {
      if (statements.length === 0) return
      await sql.transaction(statements.map((s) => sql.query(s.text, s.params)))
    },
  }
  cached = { url, client }
  return client
}

/**
 * The whole schema. Idempotent, so it can run on every cold start; it runs in
 * one round trip (a transaction) rather than one request per statement.
 *
 * Text dimensions are `NOT NULL DEFAULT ''` because a primary key cannot hold
 * NULLs, and an empty string reads as "unknown" in the panel.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS visit_daily (
    day date NOT NULL,
    landing_path text NOT NULL,
    source text NOT NULL,
    medium text NOT NULL,
    campaign text NOT NULL DEFAULT '',
    locale text NOT NULL DEFAULT '',
    device text NOT NULL DEFAULT '',
    country text NOT NULL DEFAULT '',
    visits integer NOT NULL DEFAULT 0,
    PRIMARY KEY (day, landing_path, source, medium, campaign, locale, device, country)
  )`,
  `CREATE TABLE IF NOT EXISTS pageview_daily (
    day date NOT NULL,
    path text NOT NULL,
    locale text NOT NULL DEFAULT '',
    views integer NOT NULL DEFAULT 0,
    PRIMARY KEY (day, path, locale)
  )`,
  `CREATE TABLE IF NOT EXISTS gsc_daily (
    day date NOT NULL,
    page text NOT NULL,
    query text NOT NULL,
    clicks integer NOT NULL DEFAULT 0,
    impressions integer NOT NULL DEFAULT 0,
    position_weighted real NOT NULL DEFAULT 0,
    PRIMARY KEY (day, page, query)
  )`,
  // The panel asks "top queries for these pages"; the primary key leads with
  // the day, which does not help that lookup.
  `CREATE INDEX IF NOT EXISTS gsc_daily_page_day ON gsc_daily (page, day)`,
  `CREATE TABLE IF NOT EXISTS import_log (
    id bigserial PRIMARY KEY,
    job text NOT NULL,
    ran_at timestamptz NOT NULL DEFAULT now(),
    ok boolean NOT NULL,
    detail text NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS import_log_job_ran_at ON import_log (job, ran_at DESC)`,
]

/**
 * Schema creation, at most once per instance and client. A failure clears the
 * memo so the next request tries again instead of the instance staying broken
 * until it is recycled. Keyed by client so tests with their own recorder start
 * clean.
 */
const schemaReady = new WeakMap<SqlClient, Promise<void>>()

export function ensureSchema(sql: SqlClient): Promise<void> {
  let ready = schemaReady.get(sql)
  if (!ready) {
    ready = sql.transaction(SCHEMA_STATEMENTS.map((text) => ({ text, params: [] }))).catch((err) => {
      schemaReady.delete(sql)
      throw err
    })
    schemaReady.set(sql, ready)
  }
  return ready
}

/** One line in `import_log`. `detail` is capped: it is a note, not a dump. */
export async function writeImportLog(sql: SqlClient, job: string, ok: boolean, detail: string): Promise<void> {
  await sql.query('INSERT INTO import_log (job, ok, detail) VALUES ($1, $2, $3)', [
    job.slice(0, 60),
    ok,
    detail.slice(0, 2000),
  ])
}

/**
 * A database error as something safe to show in the panel. Driver messages do
 * not normally include the connection string, but a misconfigured URL can end
 * up in one, and it carries the password.
 */
export function describeDbError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  return raw.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgres://…').slice(0, 300)
}

/** `YYYY-MM-DD` for a moment, in UTC — every day in the store is a UTC day. */
export function utcDay(at: Date): string {
  return at.toISOString().slice(0, 10)
}

/** Adds whole days to a `YYYY-MM-DD` string. */
export function addDays(day: string, n: number): string {
  const t = Date.parse(`${day}T00:00:00Z`)
  return new Date(t + n * 86_400_000).toISOString().slice(0, 10)
}
