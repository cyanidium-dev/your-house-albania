import { NextRequest, NextResponse } from 'next/server'
import { fetchCatalogMapPoints } from '@/lib/sanity/client'
import { parseCatalogFilters } from '@/lib/catalog/parseCatalogFilters'
import { propertyPath } from '@/lib/property/propertyUrl'

/**
 * Every pin for the catalogue map under the current filters (the same query
 * string the "show more" button uses). The page itself only carries the 24
 * cards it shows; the map asks for the rest here once it mounts.
 *
 * Response: `{ points: [{ slug, href, lat, lng, price?, priceUnit?, status?, approximate }] }`.
 * Cached at the edge for an hour, like the catalogue pages.
 */
export async function GET(req: NextRequest) {
  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
  const locale = typeof searchParams.locale === 'string' && /^[a-z]{2}$/.test(searchParams.locale) ? searchParams.locale : 'en'
  const parsed = parseCatalogFilters({}, searchParams)

  const rows = await fetchCatalogMapPoints({
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
    bedsExact: parsed.bedsExact || undefined,
    types: parsed.types.length ? parsed.types : undefined,
    nearSea: parsed.nearSea || undefined,
    amenities: parsed.amenities.length ? parsed.amenities : undefined,
    stage: parsed.stage || undefined,
    investment: parsed.investment || undefined,
  })

  if (!rows) {
    return NextResponse.json({ points: [] }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  const points = rows.map((r) => ({
    slug: r.slug,
    href: propertyPath(locale, r.slug, r.localizedSlug ?? undefined),
    lat: r.lat,
    lng: r.lng,
    ...(typeof r.price === 'number' ? { price: r.price } : {}),
    ...(r.priceUnit ? { priceUnit: r.priceUnit } : {}),
    ...(r.status ? { status: r.status } : {}),
    approximate: r.locationPrecision === 'approximate',
  }))

  return NextResponse.json(
    { points },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  )
}
