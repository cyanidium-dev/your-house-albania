import { NextRequest, NextResponse } from 'next/server'
import { fetchCatalogCardBySlug } from '@/lib/sanity/client'
import { mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter'

/**
 * One catalogue card, for a map pin whose listing is not among the cards the
 * page has loaded. Same shape as `/api/catalog/properties` items.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? ''
  const localeParam = req.nextUrl.searchParams.get('locale') ?? 'en'
  const locale = /^[a-z]{2}$/.test(localeParam) ? localeParam : 'en'
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) {
    return NextResponse.json({ item: null }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
  const row = await fetchCatalogCardBySlug(slug)
  if (!row) return NextResponse.json({ item: null }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json(
    { item: mapCatalogPropertyToCard(row, locale) },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  )
}
