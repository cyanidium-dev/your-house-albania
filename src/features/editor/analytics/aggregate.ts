/**
 * Pure joins for the analytics panel: visits from our store, leads from
 * Sanity, Search Console rows — matched on the same normalised source/medium
 * labels and paths the store itself uses, so a lead and the visit that brought
 * it land in the same row.
 */

import { addDays, utcDay } from '@/lib/analyticsStore/db'
import { cleanLabel } from '@/lib/analyticsStore/hit'
import { normalizePath } from '@/lib/analyticsStore/paths'
import type { PageQueryStat, PathVisits, SourceVisits, WeekTotals } from '@/lib/analyticsStore/reports'

export const RANGE_OPTIONS = [7, 28, 90] as const
export type RangeDays = (typeof RANGE_OPTIONS)[number]

export function parseDays(v: unknown): RangeDays {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return (RANGE_OPTIONS as readonly number[]).includes(n) ? (n as RangeDays) : 28
}

/** First day of a `days`-long range ending today (UTC), inclusive. */
export function rangeStart(days: number, now: Date): string {
  return addDays(utcDay(now), -(days - 1))
}

/** Monday of the ISO week a `YYYY-MM-DD` day falls in. */
export function isoWeekStart(day: string): string {
  const d = new Date(`${day}T00:00:00Z`)
  const offset = (d.getUTCDay() + 6) % 7
  return addDays(day, -offset)
}

/** ISO week number, for labels ("W41"). */
export function isoWeekNumber(day: string): number {
  const d = new Date(`${day}T00:00:00Z`)
  // The ISO year's week 1 holds its first Thursday.
  const thursday = new Date(d.getTime() + (3 - ((d.getUTCDay() + 6) % 7)) * 86_400_000)
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  return Math.floor((thursday.getTime() - yearStart) / (7 * 86_400_000)) + 1
}

/** The lead fields the panel reads (Sanity `lead`, see `buildLeadDocument`). */
export type PanelLead = {
  type?: string | null
  source?: string | null
  medium?: string | null
  landingPage?: string | null
  createdAt: string
}

/** A form lead (name and phone left), as opposed to a click on a contact link. */
export function isFormLead(lead: PanelLead): boolean {
  return typeof lead.type === 'string' && lead.type !== '' && !lead.type.startsWith('click_')
}

const UNKNOWN = '(unknown)'

function leadSource(lead: PanelLead): { source: string; medium: string } {
  return {
    source: cleanLabel(lead.source, 80) || UNKNOWN,
    medium: cleanLabel(lead.medium, 40) || UNKNOWN,
  }
}

function leadLanding(lead: PanelLead): string {
  return normalizePath(lead.landingPage) ?? UNKNOWN
}

export type SourceRow = {
  source: string
  medium: string
  /** `null` when the database is not connected. */
  visits: number | null
  leads: number
  forms: number
  /** Leads per visit, `null` without visits. */
  conversion: number | null
}

export function mergeSources(visits: SourceVisits[] | null, leads: PanelLead[]): SourceRow[] {
  const rows = new Map<string, SourceRow>()
  const row = (source: string, medium: string): SourceRow => {
    const key = `${source}\u0000${medium}`
    let r = rows.get(key)
    if (!r) {
      r = { source, medium, visits: visits ? 0 : null, leads: 0, forms: 0, conversion: null }
      rows.set(key, r)
    }
    return r
  }
  for (const v of visits ?? []) row(v.source, v.medium).visits = v.visits
  for (const lead of leads) {
    const { source, medium } = leadSource(lead)
    const r = row(source, medium)
    r.leads += 1
    if (isFormLead(lead)) r.forms += 1
  }
  for (const r of rows.values()) r.conversion = r.visits ? r.leads / r.visits : null
  return [...rows.values()].sort(
    (a, b) => (b.visits ?? 0) - (a.visits ?? 0) || b.leads - a.leads || a.source.localeCompare(b.source)
  )
}

export type LandingRow = {
  path: string
  visits: number | null
  leads: number
  forms: number
  /** Top Search Console queries for the page; `null` without a database. */
  queries: PageQueryStat[] | null
}

export function leadsByLanding(leads: PanelLead[]): Map<string, { leads: number; forms: number }> {
  const out = new Map<string, { leads: number; forms: number }>()
  for (const lead of leads) {
    const path = leadLanding(lead)
    const r = out.get(path) ?? { leads: 0, forms: 0 }
    r.leads += 1
    if (isFormLead(lead)) r.forms += 1
    out.set(path, r)
  }
  return out
}

/** Pages ranked by leads, most first; the unknown bucket goes last. */
export function topLeadLandings(byLanding: Map<string, { leads: number; forms: number }>, limit: number): string[] {
  return [...byLanding.entries()]
    .sort((a, b) => Number(a[0] === UNKNOWN) - Number(b[0] === UNKNOWN) || b[1].leads - a[1].leads || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([path]) => path)
}

export function landingRows(
  paths: string[],
  visits: PathVisits[] | null,
  byLanding: Map<string, { leads: number; forms: number }>,
  queries: PageQueryStat[] | null
): LandingRow[] {
  const visitMap = new Map((visits ?? []).map((v) => [v.path, v.visits]))
  return paths.map((path) => ({
    path,
    visits: visits ? (visitMap.get(path) ?? 0) : null,
    leads: byLanding.get(path)?.leads ?? 0,
    forms: byLanding.get(path)?.forms ?? 0,
    queries: queries ? queries.filter((q) => q.page === path) : null,
  }))
}

export type WeekRow = {
  week: string
  visits: number | null
  leads: number
  clicks: number | null
  impressions: number | null
}

/** One row per ISO week touching `[from, today]`, oldest first. */
export function weekRows(from: string, today: string, weekly: WeekTotals[] | null, leads: PanelLead[]): WeekRow[] {
  const byWeek = new Map((weekly ?? []).map((w) => [w.week, w]))
  const leadCounts = new Map<string, number>()
  for (const lead of leads) {
    const day = lead.createdAt?.slice(0, 10)
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
    const w = isoWeekStart(day)
    leadCounts.set(w, (leadCounts.get(w) ?? 0) + 1)
  }
  const out: WeekRow[] = []
  for (let w = isoWeekStart(from); w <= today; w = addDays(w, 7)) {
    const t = byWeek.get(w)
    out.push({
      week: w,
      visits: weekly ? (t?.visits ?? 0) : null,
      leads: leadCounts.get(w) ?? 0,
      clicks: weekly ? (t?.clicks ?? 0) : null,
      impressions: weekly ? (t?.impressions ?? 0) : null,
    })
  }
  return out
}
