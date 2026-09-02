import { after, type NextRequest } from 'next/server'
import { clientKeyFromHeaders } from '@/lib/ai/rateLimit'
import { isCountableSlug, isViewKind, recordView } from '@/lib/metrics/viewCounter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** One visitor counts once per thing per this window. */
const DEDUPE_WINDOW_MS = 30 * 60 * 1000

/**
 * Recently counted (client, kind, slug) triples. In memory, so it is per
 * instance — the browser's own sessionStorage guard is the first line and this
 * catches reloads and duplicate beacons behind it. Both together are enough to
 * keep the number honest; neither pretends to be exact.
 */
const seen = new Map<string, number>()

function alreadyCounted(key: string, now: number): boolean {
  if (seen.size > 5000) {
    for (const [k, at] of seen) {
      if (at + DEDUPE_WINDOW_MS <= now) seen.delete(k)
    }
  }
  const at = seen.get(key)
  if (at !== undefined && at + DEDUPE_WINDOW_MS > now) return true
  seen.set(key, now)
  return false
}

/** Obvious crawlers, so counters reflect people rather than indexers. */
const BOT_PATTERN = /bot|crawler|spider|crawling|headlesschrome|lighthouse|pagespeed|preview/i

/**
 * View beacon. Answers 204 whatever happens: the browser sends this with
 * `keepalive` while navigating away and has nothing useful to do with an error.
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

  const kind = (body as { kind?: unknown })?.kind
  const slug = (body as { slug?: unknown })?.slug
  if (!isViewKind(kind) || !isCountableSlug(slug)) return noContent

  const key = `${clientKeyFromHeaders(req.headers)}:${kind}:${slug}`
  if (alreadyCounted(key, Date.now())) return noContent

  // The write happens after the 204 is on its way; a floating promise would be
  // dropped when the invocation freezes.
  after(async () => {
    await recordView(kind, slug)
  })

  return noContent
}
