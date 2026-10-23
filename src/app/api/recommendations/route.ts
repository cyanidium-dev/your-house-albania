import { getCatalogSnapshot } from '@/lib/ai/catalogSnapshot'
import { attachMarketPositionToCards } from '@/lib/property/marketPosition'
import { MAX_VIEWED_SLUGS, recommend } from '@/lib/personalization/recommend'
import { fetchPropertiesBySlugs } from '@/lib/sanity/client'
import { mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter'
import type { PropertyHomes } from '@/types/propertyHomes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SLUG = /^[a-z0-9-]{1,160}$/
const LOCALE = /^[a-z]{2}$/
const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * "Welcome back" listings for a returning visitor (E002). Body: the slugs the
 * browser remembers viewing and when its previous visit ended. Nothing is
 * stored: the answer is computed from the cached catalog snapshot.
 */
export async function POST(req: Request) {
  let body: { locale?: unknown; slugs?: unknown; since?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: NO_STORE })
  }
  const locale = typeof body.locale === 'string' && LOCALE.test(body.locale) ? body.locale : 'en'
  const slugs = Array.isArray(body.slugs)
    ? [...new Set(body.slugs.filter((s): s is string => typeof s === 'string' && SLUG.test(s)))].slice(-MAX_VIEWED_SLUGS)
    : []
  if (slugs.length === 0) return Response.json({ error: 'No slugs' }, { status: 400, headers: NO_STORE })
  const sinceMs = typeof body.since === 'string' ? Date.parse(body.since) : NaN
  const since = Number.isFinite(sinceMs) && sinceMs < Date.now() ? new Date(sinceMs) : null

  const result = recommend(await getCatalogSnapshot(), slugs, since)
  if (!result) return Response.json({ picks: [], fresh: [], freshCount: 0 }, { headers: NO_STORE })

  const wanted = [...result.fresh, ...result.picks]
  const cards = wanted.length
    ? await attachMarketPositionToCards((await fetchPropertiesBySlugs(wanted)).map((p) => mapCatalogPropertyToCard(p, locale)))
    : []
  const bySlug = new Map(cards.map((c) => [c.slug, c]))
  const inOrder = (list: string[]) => list.map((s) => bySlug.get(s)).filter((c): c is PropertyHomes => Boolean(c))
  const picks = inOrder(result.picks)
  const fresh = inOrder(result.fresh)
  const { criteria } = result
  // The city as the cards name it in this language, for "2+1 in Durrës up to €130,000".
  const cityLabel = [...fresh, ...picks].find((c) => c.citySlug === criteria.city)?.city

  return Response.json(
    {
      picks,
      fresh,
      freshCount: result.freshCount,
      criteria: {
        ...(cityLabel ? { cityLabel } : {}),
        ...(criteria.minBedrooms !== undefined ? { minBedrooms: criteria.minBedrooms, maxBedrooms: criteria.maxBedrooms } : {}),
        ...(criteria.maxPrice !== undefined ? { maxPrice: criteria.maxPrice } : {}),
      },
    },
    { headers: NO_STORE },
  )
}
