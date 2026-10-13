/**
 * Read queries for the analytics panel (`/editor/analytics`). Every value
 * arrives as a parameter; the only text spliced into SQL is a column name from
 * a fixed list. Results are cast in SQL (`::int`, `::text`, `::float8`) because
 * Postgres returns `sum()` as a bigint string and dates as `Date` objects.
 */

import type { SqlClient } from './db'

export type SourceVisits = { source: string; medium: string; visits: number }
export type PathVisits = { path: string; visits: number }
export type QueryStat = { query: string; clicks: number; impressions: number; position: number | null }
export type PageQueryStat = QueryStat & { page: string }
export type TopQuery = QueryStat & { bestPage: string | null }
export type WeekTotals = { week: string; visits: number; clicks: number; impressions: number }

export type StoreStatus = {
  visitRows: number
  pageviewRows: number
  gscRows: number
  gscFirstDay: string | null
  gscLastDay: string | null
  databaseBytes: number
  log: { job: string; ranAt: string; ok: boolean; detail: string }[]
}

export async function totalsSince(sql: SqlClient, from: string): Promise<{ visits: number; pageviews: number }> {
  const [row] = await sql.query<{ visits: number; pageviews: number }>(
    `SELECT
      (SELECT coalesce(sum(visits), 0)::int FROM visit_daily WHERE day >= $1::date) AS visits,
      (SELECT coalesce(sum(views), 0)::int FROM pageview_daily WHERE day >= $1::date) AS pageviews`,
    [from]
  )
  return row ?? { visits: 0, pageviews: 0 }
}

export async function visitsBySource(sql: SqlClient, from: string): Promise<SourceVisits[]> {
  return sql.query<SourceVisits>(
    `SELECT source, medium, sum(visits)::int AS visits
     FROM visit_daily WHERE day >= $1::date
     GROUP BY source, medium ORDER BY visits DESC LIMIT 200`,
    [from]
  )
}

export async function visitsByLanding(sql: SqlClient, from: string, limit: number): Promise<PathVisits[]> {
  return sql.query<PathVisits>(
    `SELECT landing_path AS path, sum(visits)::int AS visits
     FROM visit_daily WHERE day >= $1::date
     GROUP BY landing_path ORDER BY visits DESC, landing_path LIMIT $2`,
    [from, limit]
  )
}

/** Visits that started on each of `paths` (for pages ranked by leads). */
export async function visitsForLandings(sql: SqlClient, from: string, paths: string[]): Promise<PathVisits[]> {
  if (paths.length === 0) return []
  return sql.query<PathVisits>(
    `SELECT landing_path AS path, sum(visits)::int AS visits
     FROM visit_daily WHERE day >= $1::date AND landing_path = ANY($2::text[])
     GROUP BY landing_path`,
    [from, paths]
  )
}

/** The top `perPage` Search Console queries of each page, by clicks then impressions. */
export async function topQueriesForPages(
  sql: SqlClient,
  from: string,
  pages: string[],
  perPage = 5
): Promise<PageQueryStat[]> {
  if (pages.length === 0) return []
  return sql.query<PageQueryStat>(
    `WITH q AS (
       SELECT page, query, sum(clicks)::int AS clicks, sum(impressions)::int AS impressions,
              sum(position_weighted)::float8 AS pw
       FROM gsc_daily WHERE day >= $1::date AND page = ANY($2::text[])
       GROUP BY page, query
     ), ranked AS (
       SELECT *, row_number() OVER (PARTITION BY page ORDER BY clicks DESC, impressions DESC, query) AS rn FROM q
     )
     SELECT page, query, clicks, impressions,
            CASE WHEN impressions > 0 THEN pw / impressions END AS position
     FROM ranked WHERE rn <= $3 ORDER BY page, rn`,
    [from, pages, perPage]
  )
}

const QUERY_ORDER = { clicks: 'clicks DESC, impressions DESC', impressions: 'impressions DESC, clicks DESC' } as const

/**
 * Top queries over the range with the page that earned most of their clicks
 * (impressions break ties, which matters for queries with no clicks).
 */
export async function topQueries(
  sql: SqlClient,
  from: string,
  by: keyof typeof QUERY_ORDER,
  limit: number
): Promise<TopQuery[]> {
  return sql.query<TopQuery>(
    `WITH pq AS (
       SELECT query, page, sum(clicks) AS c, sum(impressions) AS i, sum(position_weighted) AS pw
       FROM gsc_daily WHERE day >= $1::date GROUP BY query, page
     ), best AS (
       SELECT DISTINCT ON (query) query, page FROM pq ORDER BY query, c DESC, i DESC
     ), tot AS (
       SELECT query, sum(c)::int AS clicks, sum(i)::int AS impressions, sum(pw)::float8 AS pw FROM pq GROUP BY query
     )
     SELECT tot.query, tot.clicks, tot.impressions,
            CASE WHEN tot.impressions > 0 THEN tot.pw / tot.impressions END AS position,
            best.page AS "bestPage"
     FROM tot JOIN best USING (query)
     ORDER BY ${QUERY_ORDER[by]}, tot.query LIMIT $2`,
    [from, limit]
  )
}

/** Visits and Search Console totals per ISO week (weeks start on Monday). */
export async function weeklyTotals(sql: SqlClient, from: string): Promise<WeekTotals[]> {
  return sql.query<WeekTotals>(
    `WITH v AS (
       SELECT date_trunc('week', day::timestamp)::date AS week, sum(visits)::int AS visits
       FROM visit_daily WHERE day >= $1::date GROUP BY 1
     ), g AS (
       SELECT date_trunc('week', day::timestamp)::date AS week, sum(clicks)::int AS clicks, sum(impressions)::int AS impressions
       FROM gsc_daily WHERE day >= $1::date GROUP BY 1
     )
     SELECT week::text AS week, coalesce(v.visits, 0) AS visits, coalesce(g.clicks, 0) AS clicks,
            coalesce(g.impressions, 0) AS impressions
     FROM v FULL OUTER JOIN g USING (week) ORDER BY week`,
    [from]
  )
}

export async function storeStatus(sql: SqlClient): Promise<StoreStatus> {
  const [counts] = await sql.query<Omit<StoreStatus, 'log'>>(
    `SELECT
      (SELECT count(*) FROM visit_daily)::int AS "visitRows",
      (SELECT count(*) FROM pageview_daily)::int AS "pageviewRows",
      (SELECT count(*) FROM gsc_daily)::int AS "gscRows",
      (SELECT min(day)::text FROM gsc_daily) AS "gscFirstDay",
      (SELECT max(day)::text FROM gsc_daily) AS "gscLastDay",
      pg_database_size(current_database())::float8 AS "databaseBytes"`
  )
  const log = await sql.query<StoreStatus['log'][number]>(
    `SELECT job, to_char(ran_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') AS "ranAt", ok, detail
     FROM import_log ORDER BY ran_at DESC, id DESC LIMIT 10`
  )
  return {
    visitRows: counts?.visitRows ?? 0,
    pageviewRows: counts?.pageviewRows ?? 0,
    gscRows: counts?.gscRows ?? 0,
    gscFirstDay: counts?.gscFirstDay ?? null,
    gscLastDay: counts?.gscLastDay ?? null,
    databaseBytes: counts?.databaseBytes ?? 0,
    log,
  }
}
