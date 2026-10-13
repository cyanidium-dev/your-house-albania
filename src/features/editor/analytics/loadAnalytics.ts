import 'server-only'

import { databaseConfigured, describeDbError, ensureSchema, getSql } from '@/lib/analyticsStore/db'
import { gscConfigured, gscSiteUrl } from '@/lib/analyticsStore/gscImport'
import {
  storeStatus,
  topQueries,
  topQueriesForPages,
  totalsSince,
  visitsByLanding,
  visitsBySource,
  visitsForLandings,
  weeklyTotals,
  type PathVisits,
  type StoreStatus,
  type TopQuery,
} from '@/lib/analyticsStore/reports'
import { getWriteClient } from '@/lib/sanity/writeClient'
import {
  isFormLead,
  landingRows,
  leadsByLanding,
  mergeSources,
  rangeStart,
  topLeadLandings,
  weekRows,
  type LandingRow,
  type PanelLead,
  type RangeDays,
  type SourceRow,
  type WeekRow,
} from './aggregate'

const LANDING_LIMIT = 20
const QUERY_LIMIT = 25
const POPULAR_LIMIT = 30

export type PopularListing = {
  slug: string
  title: string | null
  views7d: number | null
  views30d: number | null
  allTime: number
  likes: number
}

export type Popularity = {
  by7d: PopularListing[]
  byAllTime: PopularListing[]
  byLikes: PopularListing[]
  /** Whether any counter has the rolling 7-day field yet. */
  hasRolling: boolean
  hasLikes: boolean
}

export type PanelData = {
  days: RangeDays
  from: string
  today: string
  db: { configured: boolean; ok: boolean; error?: string }
  gsc: { configured: boolean; siteUrl: string; hasData: boolean }
  sanity: { ok: boolean; error?: string }
  leadsTotal: number
  formsTotal: number
  totals: { visits: number; pageviews: number } | null
  sources: SourceRow[]
  landingByVisits: LandingRow[] | null
  landingByLeads: LandingRow[]
  queriesByClicks: TopQuery[] | null
  queriesByImpressions: TopQuery[] | null
  weeks: WeekRow[]
  popularity: Popularity | null
  status: StoreStatus | null
}

/**
 * Leads in the range, read with the server's token client — `lead` documents
 * hold names and phone numbers and are never fetched without it. Test leads
 * (`internal`) and anything marked spam are not leads.
 */
async function fetchLeads(from: string): Promise<{ leads: PanelLead[]; error?: string }> {
  const client = getWriteClient()
  if (!client) return { leads: [], error: 'Sanity token is not configured on the server' }
  try {
    const leads = await client.fetch<PanelLead[]>(
      `*[_type == "lead" && !(_id in path("drafts.**")) && createdAt >= $from && internal != true && status != "spam"]
        | order(createdAt asc) [0...5000] { type, source, medium, landingPage, createdAt }`,
      { from: `${from}T00:00:00.000Z` }
    )
    return { leads: Array.isArray(leads) ? leads : [] }
  } catch (err) {
    return { leads: [], error: err instanceof Error ? err.message.slice(0, 200) : 'Sanity query failed' }
  }
}

type RawListing = {
  slug?: string
  title?: unknown
  views7d?: number | null
  views30d?: number | null
  allTime?: number | null
  likes?: number | null
}

function listingTitle(t: unknown): string | null {
  if (typeof t === 'string') return t
  if (t && typeof t === 'object') {
    const o = t as Record<string, unknown>
    for (const l of ['en', 'ru', 'sq']) if (typeof o[l] === 'string' && o[l]) return o[l] as string
  }
  return null
}

function toListing(r: RawListing): PopularListing | null {
  if (!r.slug) return null
  return {
    slug: r.slug,
    title: listingTitle(r.title),
    views7d: typeof r.views7d === 'number' ? r.views7d : null,
    views30d: typeof r.views30d === 'number' ? r.views30d : null,
    allTime: typeof r.allTime === 'number' ? r.allTime : 0,
    likes: typeof r.likes === 'number' ? r.likes : 0,
  }
}

/**
 * Listing popularity from the `viewCounter` documents. The rolling windows and
 * likes are newer fields; `coalesce` keeps this working on counters that only
 * have `total`.
 */
async function fetchPopularity(): Promise<Popularity | null> {
  const client = getWriteClient()
  if (!client) return null
  const projection = `{
    slug,
    "title": *[_type == "property" && slug.current == ^.slug && !(_id in path("drafts.**"))][0].title,
    views7d, views30d,
    "allTime": coalesce(allTime, total, 0),
    "likes": coalesce(likes, 0)
  }`
  const base = `*[_type == "viewCounter" && kind == "property" && defined(slug)]`
  try {
    const res = await client.fetch<{
      by7d: RawListing[]
      byAllTime: RawListing[]
      byLikes: RawListing[]
      rolling: number
      liked: number
    }>(
      `{
        "by7d": ${base} | order(coalesce(views7d, 0) desc, coalesce(allTime, total, 0) desc) [0...${POPULAR_LIMIT}] ${projection},
        "byAllTime": ${base} | order(coalesce(allTime, total, 0) desc) [0...${POPULAR_LIMIT}] ${projection},
        "byLikes": ${base} [coalesce(likes, 0) > 0] | order(likes desc, coalesce(allTime, total, 0) desc) [0...${POPULAR_LIMIT}] ${projection},
        "rolling": count(${base} [defined(views7d)]),
        "liked": count(${base} [defined(likes)])
      }`
    )
    const list = (rows: RawListing[] | undefined) => (rows ?? []).map(toListing).filter((r): r is PopularListing => r !== null)
    return {
      by7d: list(res.by7d),
      byAllTime: list(res.byAllTime),
      byLikes: list(res.byLikes),
      hasRolling: (res.rolling ?? 0) > 0,
      hasLikes: (res.liked ?? 0) > 0,
    }
  } catch (err) {
    console.warn('[editor/analytics] popularity query failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Everything the panel shows for one range. Each source fails on its own: no
 * database still shows leads, no Sanity token still shows visits.
 */
export async function loadAnalytics(days: RangeDays, now = new Date()): Promise<PanelData> {
  const from = rangeStart(days, now)
  const today = now.toISOString().slice(0, 10)
  const sql = getSql()

  const [{ leads, error: leadsError }, popularity] = await Promise.all([fetchLeads(from), fetchPopularity()])
  const byLanding = leadsByLanding(leads)
  const leadLandingPaths = topLeadLandings(byLanding, LANDING_LIMIT)

  const data: PanelData = {
    days,
    from,
    today,
    db: { configured: databaseConfigured(), ok: false },
    gsc: { configured: gscConfigured(), siteUrl: gscSiteUrl(), hasData: false },
    sanity: leadsError ? { ok: false, error: leadsError } : { ok: true },
    leadsTotal: leads.length,
    formsTotal: leads.filter(isFormLead).length,
    totals: null,
    sources: mergeSources(null, leads),
    landingByVisits: null,
    landingByLeads: landingRows(leadLandingPaths, null, byLanding, null),
    queriesByClicks: null,
    queriesByImpressions: null,
    weeks: weekRows(from, today, null, leads),
    popularity,
    status: null,
  }

  if (!sql) return data

  try {
    await ensureSchema(sql)
    const [totals, sources, landings, leadLandingVisits, byClicks, byImpressions, weekly, status] = await Promise.all([
      totalsSince(sql, from),
      visitsBySource(sql, from),
      visitsByLanding(sql, from, LANDING_LIMIT),
      visitsForLandings(sql, from, leadLandingPaths),
      topQueries(sql, from, 'clicks', QUERY_LIMIT),
      topQueries(sql, from, 'impressions', QUERY_LIMIT),
      weeklyTotals(sql, from),
      storeStatus(sql),
    ])
    const visitPaths = landings.map((l: PathVisits) => l.path)
    const pages = [...new Set([...visitPaths, ...leadLandingPaths])]
    const queries = await topQueriesForPages(sql, from, pages, 5)

    data.db.ok = true
    data.gsc.hasData = status.gscRows > 0
    data.totals = totals
    data.sources = mergeSources(sources, leads)
    data.landingByVisits = landingRows(visitPaths, landings, byLanding, queries)
    data.landingByLeads = landingRows(leadLandingPaths, leadLandingVisits, byLanding, queries)
    data.queriesByClicks = byClicks
    data.queriesByImpressions = byImpressions
    data.weeks = weekRows(from, today, weekly, leads)
    data.status = status
  } catch (err) {
    data.db.error = describeDbError(err)
  }
  return data
}
