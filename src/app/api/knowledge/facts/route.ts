import { NextResponse, type NextRequest } from 'next/server'
import {
  fetchFactsByDataIds,
  searchKnowledgeFacts,
  type KnowledgeFact,
} from '@/lib/sanity/queries/knowledge'
import { getSiteBaseUrl } from '@/lib/siteUrl'

export const runtime = 'nodejs'
export const revalidate = 3600

/**
 * Public, read-only access to the sourced figures behind the knowledge base.
 *
 * It exists for three readers: the site's own assistant, the AI search engines
 * that increasingly answer "how much is electricity in Durrës" without sending
 * anyone to a page, and anyone who wants to check a number we published. All
 * three are better served by a citable JSON document than by scraping a table,
 * and the provenance travels with the value rather than being left behind.
 *
 *   GET /api/knowledge/facts?ids=DATA-ELEC-0001,DATA-WATER-0001
 *   GET /api/knowledge/facts?category=electricity&city=durres&q=tariff&limit=20
 *
 * Open without a key: the data is published on the pages anyway, and a key
 * would only stop the machines it is meant for.
 */

const MAX_LIMIT = 50

function publicFact(fact: KnowledgeFact, baseUrl: string, locale: string) {
  return {
    dataId: fact.dataId,
    category: fact.category,
    metric: fact.metric,
    label: fact.title ?? undefined,
    dataKind: fact.dataKind,
    value: fact.value ?? null,
    valueLow: fact.valueLow ?? null,
    valueHigh: fact.valueHigh ?? null,
    unit: fact.unit,
    valueText: fact.valueText ?? undefined,
    original:
      typeof fact.originalValue === 'number'
        ? { value: fact.originalValue, currency: fact.originalCurrency ?? null }
        : undefined,
    // Both, because they are not the same thing: a Ksamil figure is filed
    // under the city of Sarandë, and collapsing them loses the precise place.
    city: fact.citySlug ?? undefined,
    geography: fact.geography ?? (fact.citySlug ? undefined : 'Albania'),
    propertyType: fact.propertyType ?? undefined,
    season: fact.season ?? undefined,
    period: fact.period,
    confidence: fact.confidence,
    methodology: fact.methodology ?? undefined,
    lastVerifiedAt: fact.lastVerifiedAt ?? undefined,
    source: fact.source
      ? {
          sourceId: fact.source.sourceId,
          name: fact.source.name,
          url: fact.source.url ?? undefined,
          archivedUrl: fact.source.archivedUrl ?? undefined,
          type: fact.source.sourceType ?? undefined,
          publishedAt: fact.source.publishedAt ?? undefined,
        }
      : undefined,
    quote: fact.rawQuote ?? undefined,
    page: fact.articleSlug ? `${baseUrl}/${locale}/knowledge/${fact.articleSlug}#${fact.dataId}` : undefined,
  }
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const baseUrl = getSiteBaseUrl()
  const locale = (params.get('locale') || 'en').slice(0, 5)

  const rawIds = params.get('ids')
  const ids = rawIds
    ? rawIds
        .split(',')
        .map((id) => id.trim().toUpperCase())
        .filter((id) => /^DATA-[A-Z0-9-]{2,60}$/.test(id))
        .slice(0, MAX_LIMIT)
    : []

  const limitParam = Number(params.get('limit'))
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), MAX_LIMIT)
    : 20

  try {
    const facts = ids.length
      ? await fetchFactsByDataIds(ids)
      : await searchKnowledgeFacts({
          query: params.get('q')?.slice(0, 120) || undefined,
          category: params.get('category')?.slice(0, 40) || undefined,
          citySlug: params.get('city')?.slice(0, 40) || undefined,
          season: params.get('season')?.slice(0, 20) || undefined,
          limit,
        })

    return NextResponse.json(
      {
        facts: facts.map((fact) => publicFact(fact, baseUrl, locale)),
        count: facts.length,
        notFound: ids.filter((id) => !facts.some((fact) => fact.dataId === id)),
        licence:
          'Figures are compiled by DomLivo from the named sources. Reuse with attribution to DomLivo and to the original source.',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (err) {
    console.warn('[knowledge] public facts endpoint failed:', err)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
