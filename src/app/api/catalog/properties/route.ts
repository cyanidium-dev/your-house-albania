import { NextRequest, NextResponse } from 'next/server'
import { fetchCatalogProperties } from '@/lib/sanity/client'
import { mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter'
import { parseCatalogFilters } from '@/lib/catalog/parseCatalogFilters'
import type { CatalogSort } from '@/lib/sanity/client'
import { attachMarketPositionToCards } from '@/lib/property/marketPosition'

const PAGE_SIZE_OPTIONS = [12, 24, 36, 48]
/** Sanity document ids, as the banner exclusions carry them. */
const DOCUMENT_ID = /^[A-Za-z0-9._-]{1,128}$/
const MAX_EXCLUDED = 10
const DEFAULT_PAGE_SIZE = 24

export async function GET(req: NextRequest) {
  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
  const locale = typeof searchParams.locale === 'string' ? searchParams.locale : 'en'

  const parsed = parseCatalogFilters({}, searchParams)
  const pageSize = PAGE_SIZE_OPTIONS.includes(parsed.pageSize) ? parsed.pageSize : DEFAULT_PAGE_SIZE
  const excluded = (typeof searchParams.exclude === 'string' ? searchParams.exclude.split(',') : [])
    .map((id) => id.trim())
    .filter((id) => DOCUMENT_ID.test(id))
    .slice(0, MAX_EXCLUDED)

  const result = await fetchCatalogProperties({
    agentSlug: parsed.agentSlug || undefined,
    city: parsed.city || undefined,
    cities: parsed.cities.length ? parsed.cities : undefined,
    district: parsed.district || undefined,
    type: parsed.type || undefined,
    deal: parsed.deal || undefined,
    minPrice: parsed.minPrice || undefined,
    maxPrice: parsed.maxPrice || undefined,
    minArea: parsed.minArea || undefined,
    maxArea: parsed.maxArea || undefined,
    beds: parsed.beds || undefined,
    bedsExact: parsed.bedsExact || undefined,
    types: parsed.types.length ? parsed.types : undefined,
    nearSea: parsed.nearSea || undefined,
    amenities: parsed.amenities.length ? parsed.amenities : undefined,
    stage: parsed.stage || undefined,
    investment: parsed.investment || undefined,
    sort: parsed.sort as CatalogSort,
    page: parsed.page,
    pageSize,
    excludedPropertyIds: excluded.length ? excluded : undefined,
  })

  if (!result) {
    return NextResponse.json({ items: [], totalCount: 0 }, { status: 500 })
  }

  // The same "below / above market" badge the server-rendered first page has.
  const items = await attachMarketPositionToCards(
    (result.items ?? []).map((item) => mapCatalogPropertyToCard(item, locale)),
  )

  return NextResponse.json({ items, totalCount: result.totalCount ?? 0 })
}
