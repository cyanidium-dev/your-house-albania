import { after, type NextRequest } from 'next/server'
import { clientKeyFromHeaders } from '@/lib/ai/rateLimit'
import { describeDbError, ensureSchema, getSql } from '@/lib/analyticsStore/db'
import { buildHitRow, createHitThrottle, MAX_HIT_BODY_BYTES, parseHit, recordHit } from '@/lib/analyticsStore/hit'
import { isLikelyBot } from '@/lib/leads/clickGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const allow = createHitThrottle()

/**
 * Visit beacon: one per page view, sent by `LeadTracker` with `sendBeacon`.
 * Feeds the `visit_daily` / `pageview_daily` aggregates (see
 * `docs/analytics/OWN-ANALYTICS.md`).
 *
 * Answers 204 whatever happens — the browser has nothing useful to do with an
 * error, and an unconnected database is a normal state, not a failure. The
 * write runs in `after()`, once the response is on its way.
 */
export async function POST(req: NextRequest) {
  const noContent = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

  // No user agent at all, crawlers, headless browsers and HTTP libraries.
  const userAgent = req.headers.get('user-agent') ?? ''
  if (!userAgent || isLikelyBot(userAgent)) return noContent

  // Preview deployments share the production database when it is connected to
  // every environment; their traffic is the team's, not visitors'.
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv && vercelEnv !== 'production') return noContent

  const sql = getSql()
  if (!sql) return noContent

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return noContent
  }
  if (raw.length > MAX_HIT_BODY_BYTES) return noContent

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return noContent
  }

  const hit = parseHit(body)
  if (!hit) return noContent
  if (!allow(clientKeyFromHeaders(req.headers), hit.entry, Date.now())) return noContent

  const row = buildHitRow(hit, {
    userAgent,
    country: req.headers.get('x-vercel-ip-country'),
    now: new Date(),
  })

  // A floating promise would be dropped when the invocation freezes.
  after(async () => {
    try {
      await ensureSchema(sql)
      await recordHit(sql, row)
    } catch (err) {
      console.warn('[metrics/hit] write failed:', describeDbError(err))
    }
  })

  return noContent
}
