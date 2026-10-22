import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getClient } from '@/lib/sanity/queries/_core'
import { TYPE_TO_TAGS, tagsForTypes } from '@/lib/sanity/revalidation'
import { submitUrlsToIndexNow } from '@/lib/seo/indexNow'
import { urlsForMutatedDocument } from '@/lib/seo/indexNowDocumentUrls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Vercel cron sends Authorization: Bearer <CRON_SECRET>. Optional ?secret= for manual/local calls. */
function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${cronSecret}`) return true
  return new URL(request.url).searchParams.get('secret') === cronSecret
}

/** The cron runs hourly; five spare minutes cover a late start. */
const LOOKBACK_MS = 65 * 60 * 1000
/** IndexNow for at most this many changed documents per run (bulk imports). */
const INDEXNOW_DOCS = 200

type Changed = { _id: string; _type: string }

/**
 * Hourly scan of what changed in Sanity (vercel.json), in place of a webhook.
 *
 * Pages and data are cached for a day (2026-10-22: hourly ISR on ~20k URLs
 * crawled by search and AI bots was 2.4M ISR writes and most of the Vercel
 * bill). Edits still reach the site within the hour: this run purges the tags
 * of the document types published since the last run, and tells IndexNow
 * about the pages they change. The webhook route does the same per event,
 * but needs SANITY_REVALIDATE_SECRET and a webhook in Sanity, neither of which
 * was ever set up; this needs neither.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return new Response('Unauthorized', { status: 401 })
  const client = getClient()
  if (!client) return Response.json({ ok: false, reason: 'Sanity client not configured' }, { status: 503 })

  const since = new Date(Date.now() - LOOKBACK_MS).toISOString()
  const changed = await client.fetch<Changed[]>(
    `*[_updatedAt > $since && !(_id in path("drafts.**")) && !(_type match "sanity.*")] | order(_updatedAt desc) [0...2000] { _id, _type }`,
    { since },
    { cache: 'no-store' } as never,
  )
  const types = [...new Set(changed.map((d) => d._type))]
  const tags = tagsForTypes(types)
  for (const tag of tags) revalidateTag(tag)

  const urls = (
    // Content types only: view counters and leads change every hour too.
    await Promise.all(changed.filter((d) => TYPE_TO_TAGS[d._type]).slice(0, INDEXNOW_DOCS).map((d) => urlsForMutatedDocument(d._type, d._id)))
  ).flat()
  const indexNow = urls.length ? await submitUrlsToIndexNow([...new Set(urls)]) : null

  return Response.json({ ok: true, since, documents: changed.length, types, revalidated: tags, urls: urls.length, indexNow })
}
