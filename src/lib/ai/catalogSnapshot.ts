/**
 * The whole public catalog, compressed into something a model can hold in one
 * prompt.
 *
 * With ~43 published listings this replaces retrieval entirely: the model sees
 * every property at once and does the semantic matching ("by the sea", "quiet",
 * "for renting out") that the GROQ filter vocabulary cannot express. The
 * snapshot is built through `PUBLISHED_PROPERTY_FILTER`, so a draft, sold or
 * archived listing cannot reach the model in the first place.
 *
 * Written in English on purpose. Its only reader is the model — visitor-facing
 * strings come from `mapCatalogPropertyToCard(item, locale)` at render time —
 * and one language means one prompt prefix shared by all six locales, which is
 * what makes prompt caching worth having.
 */

import { getClient, sanityCache, SANITY_TAGS } from '@/lib/sanity/queries/_core'
import { PUBLISHED_PROPERTY_FILTER } from '@/lib/sanity/groq/propertyFilters'
import { PUBLIC_DEAL_TYPES } from '@/lib/catalog/publicDealTypes'
import { resolveLocalizedString } from '@/lib/sanity/localized'

/** Characters of the description kept per listing — enough to match on, cheap to send. */
const TEASER_CHARS = 130

type SnapshotRow = {
  slug?: string
  title?: unknown
  description?: unknown
  price?: number
  area?: number
  bedrooms?: number
  bathrooms?: number
  yearBuilt?: number
  status?: string
  city?: { slug?: string; title?: unknown }
  district?: { slug?: string; title?: unknown }
  type?: { slug?: string; title?: unknown }
  amenities?: (string | null)[]
}

export type CatalogFacets = {
  /** City slugs that actually have listings, most stock first. */
  cities: { slug: string; label: string; count: number }[]
  districts: { slug: string; label: string; citySlug: string; count: number }[]
  propertyTypes: { slug: string; label: string; count: number }[]
  amenities: string[]
  priceMinEur: number
  priceMaxEur: number
  total: number
}

export type CatalogSnapshot = {
  /** One line per listing, ready to paste into the system prompt. */
  lines: string[]
  facets: CatalogFacets
}

function compactText(value: unknown, limit: number): string {
  const raw = typeof value === 'string' ? value : ''
  const flat = raw.replace(/\s+/g, ' ').trim()
  if (flat.length <= limit) return flat
  return `${flat.slice(0, limit).trimEnd()}…`
}

function tally(entries: { slug: string; label: string }[]): Map<string, { label: string; count: number }> {
  const out = new Map<string, { label: string; count: number }>()
  for (const entry of entries) {
    if (!entry.slug) continue
    const existing = out.get(entry.slug)
    if (existing) existing.count += 1
    else out.set(entry.slug, { label: entry.label || entry.slug, count: 1 })
  }
  return out
}

function buildSnapshot(rows: SnapshotRow[]): CatalogSnapshot {
  const lines: string[] = []
  const cityEntries: { slug: string; label: string }[] = []
  const typeEntries: { slug: string; label: string }[] = []
  const districtCounts = new Map<string, { label: string; citySlug: string; count: number }>()
  const amenityVocabulary = new Set<string>()
  let priceMin = Number.POSITIVE_INFINITY
  let priceMax = 0

  for (const row of rows) {
    const slug = row.slug?.trim()
    if (!slug) continue

    const citySlug = row.city?.slug?.trim() ?? ''
    const districtSlug = row.district?.slug?.trim() ?? ''
    const typeSlug = row.type?.slug?.trim() ?? ''
    const cityLabel = resolveLocalizedString(row.city?.title as never, 'en') || citySlug
    const districtLabel = resolveLocalizedString(row.district?.title as never, 'en') || districtSlug
    const typeLabel = resolveLocalizedString(row.type?.title as never, 'en') || typeSlug

    if (citySlug) cityEntries.push({ slug: citySlug, label: cityLabel })
    if (typeSlug) typeEntries.push({ slug: typeSlug, label: typeLabel })
    if (districtSlug) {
      const existing = districtCounts.get(districtSlug)
      if (existing) existing.count += 1
      else districtCounts.set(districtSlug, { label: districtLabel, citySlug, count: 1 })
    }

    const amenities = (row.amenities ?? []).filter(
      (a): a is string => typeof a === 'string' && a.length > 0,
    )
    amenities.forEach((a) => amenityVocabulary.add(a))

    const price = typeof row.price === 'number' && row.price > 0 ? Math.round(row.price) : 0
    const area = typeof row.area === 'number' && row.area > 0 ? Math.round(row.area) : 0
    if (price > 0) {
      priceMin = Math.min(priceMin, price)
      priceMax = Math.max(priceMax, price)
    }
    const perM2 = price > 0 && area > 0 ? Math.round(price / area) : 0

    const cells = [
      slug,
      [districtLabel, cityLabel].filter(Boolean).join('/') || '—',
      typeSlug || '—',
      row.status ?? '—',
      price > 0 ? `${price} EUR` : 'price n/a',
      area > 0 ? `${area}m2` : 'area n/a',
      `${row.bedrooms ?? 0}bd/${row.bathrooms ?? 0}ba`,
      row.yearBuilt ? `built ${row.yearBuilt}` : 'year n/a',
      perM2 > 0 ? `${perM2} EUR/m2` : '',
      amenities.join(',') || '',
      compactText(resolveLocalizedString(row.description as never, 'en'), TEASER_CHARS),
    ]
    lines.push(cells.filter((cell) => cell !== '').join(' | '))
  }

  const cityTally = tally(cityEntries)
  const typeTally = tally(typeEntries)

  return {
    lines,
    facets: {
      cities: [...cityTally.entries()]
        .map(([slug, v]) => ({ slug, label: v.label, count: v.count }))
        .sort((a, b) => b.count - a.count),
      districts: [...districtCounts.entries()]
        .map(([slug, v]) => ({ slug, label: v.label, citySlug: v.citySlug, count: v.count }))
        .sort((a, b) => b.count - a.count),
      propertyTypes: [...typeTally.entries()]
        .map(([slug, v]) => ({ slug, label: v.label, count: v.count }))
        .sort((a, b) => b.count - a.count),
      amenities: [...amenityVocabulary].sort(),
      priceMinEur: Number.isFinite(priceMin) ? priceMin : 0,
      priceMaxEur: priceMax,
      total: lines.length,
    },
  }
}

const EMPTY_SNAPSHOT: CatalogSnapshot = {
  lines: [],
  facets: {
    cities: [],
    districts: [],
    propertyTypes: [],
    amenities: [],
    priceMinEur: 0,
    priceMaxEur: 0,
    total: 0,
  },
}

async function fetchCatalogSnapshot(): Promise<CatalogSnapshot> {
  const client = getClient()
  if (!client) return EMPTY_SNAPSHOT

  // `status in $publicDealTypes` mirrors the unfiltered catalog: rentals are
  // hidden from public surfaces, and the assistant is a public surface.
  const query = `*[_type == "property" && ${PUBLISHED_PROPERTY_FILTER} && status in $publicDealTypes] | order(price asc) {
    "slug": slug.current,
    title,
    description,
    price,
    area,
    bedrooms,
    bathrooms,
    yearBuilt,
    status,
    "city": city-> { "slug": slug.current, title },
    "district": district-> { "slug": slug.current, title },
    "type": type-> { "slug": slug.current, title },
    "amenities": amenitiesRefs[@->needsReview != true]->slug.current
  }`

  try {
    const rows = await client.fetch<SnapshotRow[]>(query, {
      publicDealTypes: [...PUBLIC_DEAL_TYPES],
    })
    return buildSnapshot(Array.isArray(rows) ? rows : [])
  } catch (err) {
    console.warn('[ai] catalog snapshot failed:', err)
    return EMPTY_SNAPSHOT
  }
}

/**
 * Cached snapshot. Invalidated by the existing Sanity webhook through the same
 * tags the catalog uses, so a published listing reaches the assistant on the
 * same edit that puts it in the catalog.
 */
export const getCatalogSnapshot = sanityCache(
  fetchCatalogSnapshot,
  ['ai-catalog-snapshot'],
  {
    revalidate: 600,
    tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType],
  },
)

export const __testables = { buildSnapshot, compactText }
