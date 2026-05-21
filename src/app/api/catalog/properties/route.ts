import { NextRequest, NextResponse } from 'next/server'
import { fetchCatalogProperties } from '@/lib/sanity/client'
import { mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter'
import { parseCatalogFilters } from '@/lib/catalog/parseCatalogFilters'
import type { CatalogSort } from '@/lib/sanity/client'

const PAGE_SIZE_OPTIONS = [12, 24, 36, 48]
const DEFAULT_PAGE_SIZE = 24

export async function GET(req: NextRequest) {
  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
  const locale = typeof searchParams.locale === 'string' ? searchParams.locale : 'en'

  const parsed = parseCatalogFilters({}, searchParams)
  const pageSize = PAGE_SIZE_OPTIONS.includes(parsed.pageSize) ? parsed.pageSize : DEFAULT_PAGE_SIZE

  const result = await fetchCatalogProperties({
    agentSlug: parsed.agentSlug || undefined,
    city: parsed.city || undefined,
    district: parsed.district || undefined,
    type: parsed.type || undefined,
    deal: parsed.deal || undefined,
    minPrice: parsed.minPrice || undefined,
    maxPrice: parsed.maxPrice || undefined,
    minArea: parsed.minArea || undefined,
    maxArea: parsed.maxArea || undefined,
    beds: parsed.beds || undefined,
    amenities: parsed.amenities.length ? parsed.amenities : undefined,
    sort: parsed.sort as CatalogSort,
    page: parsed.page,
    pageSize,
  })

  if (!result) {
    return NextResponse.json({ items: [], totalCount: 0 }, { status: 500 })
  }

  const items = (result.items ?? []).map((item) => mapCatalogPropertyToCard(item, locale))

  return NextResponse.json({ items, totalCount: result.totalCount ?? 0 })
}
