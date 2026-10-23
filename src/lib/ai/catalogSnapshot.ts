/**
 * The whole public catalog, one compact line per listing, plus the structured
 * fields the `search_properties` tool filters on.
 *
 * With ~43 listings the lines went into the prompt and replaced retrieval. At
 * 900+ they were ~50k tokens re-sent with every dialogue, most of the AI bill
 * (2026-10-23: ~$0.21 a dialogue), so the model now searches: the prompt keeps
 * the facets (cities, districts, types, price range) and the tool returns the
 * matching lines, still to be read for the semantic part ("quiet", "for
 * renting out"). The
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
import { sliceSafe, stripLoneSurrogates } from './text'

/** Characters of the description kept per listing — enough to match on, cheap to send. */
const TEASER_CHARS = 130

type SnapshotRow = {
  slug?: string
  title?: unknown
  description?: unknown
  price?: number
  area?: number
  plotArea?: number
  bedrooms?: number
  bathrooms?: number
  yearBuilt?: number
  status?: string
  city?: { slug?: string; title?: unknown }
  district?: { slug?: string; title?: unknown }
  type?: { slug?: string; title?: unknown }
  amenities?: (string | null)[]
  priceUnit?: 'total' | 'per-sqm' | null
  seaDistanceMeters?: number | null
  beachfront?: boolean | null
  constructionStage?: string | null
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

/** A listing as the search tool filters it. */
export type CatalogItem = {
  slug: string
  /** The line the model reads. */
  line: string
  city: string
  district: string
  type: string
  /** Total asking price in EUR; for an off-plan rate, rate × area; 0 when unknown. */
  price: number
  area: number
  bedrooms: number
  /** Metres to the sea; 0 for beachfront; null when unknown. */
  sea: number | null
  newBuild: boolean
  amenities: string[]
  /** Lower-cased title, description teaser and amenities: what keywords match against. */
  text: string
}

export type CatalogSnapshot = {
  /** One line per listing: what the search tool returns. */
  lines: string[]
  items: CatalogItem[]
  facets: CatalogFacets
}

function compactText(value: unknown, limit: number): string {
  const raw = typeof value === 'string' ? value : ''
  const flat = stripLoneSurrogates(raw.replace(/\s+/g, ' ').trim())
  if (flat.length <= limit) return flat
  return `${sliceSafe(flat, limit).trimEnd()}…`
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
  const items: CatalogItem[] = []
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

    // Off-plan units are quoted as a rate per m², not a total: the model read
    // "1200 EUR" as the price of a flat and offered €140k units as "under
    // €100k" (QA 2026-10-11). A rate is labelled as one and stays out of the
    // price range.
    const isRate = row.priceUnit === 'per-sqm'
    const rawPrice = typeof row.price === 'number' && row.price > 0 ? Math.round(row.price) : 0
    const price = isRate ? 0 : rawPrice
    const area = typeof row.area === 'number' && row.area > 0 ? Math.round(row.area) : 0
    if (price > 0) {
      priceMin = Math.min(priceMin, price)
      priceMax = Math.max(priceMax, price)
    }
    const perM2 = isRate ? rawPrice : price > 0 && area > 0 ? Math.round(price / area) : 0
    const sea = row.beachfront
      ? 'beachfront'
      : typeof row.seaDistanceMeters === 'number' && row.seaDistanceMeters >= 0
        ? `${Math.round(row.seaDistanceMeters)}m to sea`
        : 'sea distance n/a'
    const stage =
      row.constructionStage === 'under-construction' || row.constructionStage === 'off-plan'
        ? 'new build, not finished'
        : row.constructionStage === 'completed'
          ? 'finished'
          : ''

    const cells = [
      slug,
      [districtLabel, cityLabel].filter(Boolean).join('/') || '—',
      typeSlug || '—',
      row.status ?? '—',
      isRate && rawPrice > 0
        ? `rate ${rawPrice} EUR/m2, total depends on the unit${area > 0 ? ` (≈${Math.round((rawPrice * area) / 1000)}k EUR for ${area}m2)` : ''}`
        : price > 0
          ? `${price} EUR`
          : 'price n/a',
      area > 0 ? `${area}m2` : 'area n/a',
      typeof row.plotArea === 'number' && row.plotArea > 0 ? `plot ${Math.round(row.plotArea)}m2` : '',
      `${row.bedrooms ?? 0}bd/${row.bathrooms ?? 0}ba`,
      row.yearBuilt ? `built ${row.yearBuilt}` : 'year n/a',
      perM2 > 0 ? `${perM2} EUR/m2` : '',
      sea,
      stage,
      amenities.join(',') || '',
      compactText(resolveLocalizedString(row.description as never, 'en'), TEASER_CHARS),
    ]
    const line = cells.filter((cell) => cell !== '').join(' | ')
    lines.push(line)
    items.push({
      slug,
      line,
      city: citySlug,
      district: districtSlug,
      type: typeSlug,
      price: isRate ? (rawPrice > 0 && area > 0 ? rawPrice * area : 0) : price,
      area,
      bedrooms: typeof row.bedrooms === 'number' ? row.bedrooms : 0,
      sea: row.beachfront ? 0 : typeof row.seaDistanceMeters === 'number' && row.seaDistanceMeters >= 0 ? row.seaDistanceMeters : null,
      newBuild: row.constructionStage === 'under-construction' || row.constructionStage === 'off-plan',
      amenities,
      text: [
        resolveLocalizedString(row.title as never, 'en'),
        compactText(resolveLocalizedString(row.description as never, 'en'), 400),
        amenities.join(' '),
      ]
        .join(' ')
        .toLowerCase(),
    })
  }

  const cityTally = tally(cityEntries)
  const typeTally = tally(typeEntries)

  return {
    lines,
    items,
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
  items: [],
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
    plotArea,
    bedrooms,
    bathrooms,
    yearBuilt,
    status,
    "city": city-> { "slug": slug.current, title },
    "district": district-> { "slug": slug.current, title },
    "type": type-> { "slug": slug.current, title },
    "amenities": amenitiesRefs[@->needsReview != true]->slug.current,
    priceUnit,
    seaDistanceMeters,
    beachfront,
    constructionStage
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
