/**
 * The visit beacon (`POST /api/metrics/hit`): what the browser may send, what
 * the server adds, and the two upserts it turns into.
 *
 * The body comes from the browser and is trusted for nothing: every field is
 * rebuilt here, capped and reduced to a fixed alphabet. The server adds the
 * coarse context it can see itself — device class from the user agent,
 * country from the edge's geo header — and keeps neither the user agent nor
 * the IP address. What reaches the database is a +1 on an aggregate row.
 */

import { createHash } from 'node:crypto'
import { classifyDevice } from '@/lib/analytics/trafficSource'
import type { Statement, SqlClient } from './db'
import { utcDay } from './db'
import { localeOfPath, normalizePath } from './paths'

/** A real body is ~150 bytes; anything far bigger is not from our page. */
export const MAX_HIT_BODY_BYTES = 2048

export type HitInput = {
  path: string
  /** First page of the visit: counts a visit as well as a page view. */
  entry: boolean
  source: string
  medium: string
  campaign: string
}

export type HitRow = HitInput & {
  day: string
  locale: string
  device: string
  country: string
}

/** Strips control characters; collapses whitespace. */
function plain(v: string): string {
  let out = ''
  for (const ch of v) {
    const code = ch.charCodeAt(0)
    out += code < 32 || code === 127 ? ' ' : ch
  }
  return out.replace(/\s+/g, ' ').trim()
}

/**
 * A source, medium or campaign label. Letters (any script — campaign names are
 * sometimes Cyrillic), digits and the punctuation real values use; anything
 * else becomes `_`. Lower-cased so `Telegram` and `telegram` are one row.
 */
export function cleanLabel(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return plain(v)
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ._\-()+:/@&]/gu, '_')
    .slice(0, max)
    .trim()
}

/** Validates a beacon body. `null` means "drop it": no path, no hit. */
export function parseHit(body: unknown): HitInput | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const b = body as Record<string, unknown>
  const path = normalizePath(b.path)
  if (!path) return null
  return {
    path,
    entry: b.entry === true,
    source: cleanLabel(b.source, 80) || '(unknown)',
    medium: cleanLabel(b.medium, 40) || '(not set)',
    campaign: cleanLabel(b.campaign, 80),
  }
}

export function buildHitRow(
  input: HitInput,
  ctx: { userAgent: string; country?: string | null; now: Date }
): HitRow {
  const country = ctx.country?.trim().toUpperCase() ?? ''
  return {
    ...input,
    day: utcDay(ctx.now),
    locale: localeOfPath(input.path),
    // The server has no viewport width; the UA alone decides, which is right
    // for phones and tablets that say so. iPads asking for desktop sites count
    // as desktop — an accepted blind spot.
    device: classifyDevice(0, ctx.userAgent),
    country: /^[A-Z]{2}$/.test(country) ? country : '',
  }
}

/** The upserts for one hit: a page view always, a visit on the first page. */
export function hitStatements(row: HitRow): Statement[] {
  const out: Statement[] = []
  if (row.entry) {
    out.push({
      text: `INSERT INTO visit_daily (day, landing_path, source, medium, campaign, locale, device, country, visits)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
        ON CONFLICT (day, landing_path, source, medium, campaign, locale, device, country)
        DO UPDATE SET visits = visit_daily.visits + 1`,
      params: [row.day, row.path, row.source, row.medium, row.campaign, row.locale, row.device, row.country],
    })
  }
  out.push({
    text: `INSERT INTO pageview_daily (day, path, locale, views)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (day, path, locale)
      DO UPDATE SET views = pageview_daily.views + 1`,
    params: [row.day, row.path, row.locale],
  })
  return out
}

export async function recordHit(sql: SqlClient, row: HitRow): Promise<void> {
  await sql.transaction(hitStatements(row))
}

/**
 * Per-instance ceiling on hits from one client, so a script looping on the
 * beacon cannot inflate the counts or keep the database awake. Generous for a
 * person: 120 pages and 20 visit starts per 10 minutes. The key is hashed, so
 * the map never holds an IP address, and it lives only in this instance's
 * memory.
 */
export function createHitThrottle(opts: { windowMs?: number; maxHits?: number; maxEntries?: number } = {}) {
  const windowMs = opts.windowMs ?? 10 * 60 * 1000
  const maxHits = opts.maxHits ?? 120
  const maxEntries = opts.maxEntries ?? 20
  const buckets = new Map<string, { hits: number; entries: number; resetAt: number }>()

  return function allow(clientKey: string, entry: boolean, now: number): boolean {
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    }
    const key = createHash('sha256').update(clientKey).digest('base64url').slice(0, 22)
    let b = buckets.get(key)
    if (!b || b.resetAt <= now) {
      b = { hits: 0, entries: 0, resetAt: now + windowMs }
      buckets.set(key, b)
    }
    if (b.hits >= maxHits || (entry && b.entries >= maxEntries)) return false
    b.hits += 1
    if (entry) b.entries += 1
    return true
  }
}
