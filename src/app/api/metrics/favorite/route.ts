import { after, type NextRequest } from 'next/server'
import { clientKeyFromHeaders } from '@/lib/ai/rateLimit'
import { isCountableSlug, recordFavorite } from '@/lib/metrics/viewCounter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEDUPE_WINDOW_MS = 30 * 60 * 1000
const BOT_PATTERN = /bot|crawler|spider|crawling|headlesschrome|lighthouse|pagespeed|preview/i

/** Last state sent per (client, slug): a double tap or a repeated beacon does not count twice. */
const last = new Map<string, { on: boolean; at: number }>()

/**
 * Favourite beacon: `{ slug, on }`. Answers 204 whatever happens, like the view
 * beacon. The count is "browsers that saved it", not people — good enough to
 * rank and to show from a threshold, never presented as exact.
 */
export async function POST(req: NextRequest) {
  const noContent = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  const userAgent = req.headers.get('user-agent') ?? ''
  if (!userAgent || BOT_PATTERN.test(userAgent)) return noContent

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return noContent
  }
  const slug = (body as { slug?: unknown })?.slug
  const on = (body as { on?: unknown })?.on
  if (!isCountableSlug(slug) || typeof on !== 'boolean') return noContent

  const now = Date.now()
  if (last.size > 5000) for (const [k, v] of last) if (v.at + DEDUPE_WINDOW_MS <= now) last.delete(k)
  const key = `${clientKeyFromHeaders(req.headers)}:${slug}`
  const prev = last.get(key)
  if (prev && prev.on === on && prev.at + DEDUPE_WINDOW_MS > now) return noContent
  last.set(key, { on, at: now })

  after(async () => {
    await recordFavorite(slug, on ? 1 : -1)
  })
  return noContent
}
