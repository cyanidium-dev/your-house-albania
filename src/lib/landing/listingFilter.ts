/**
 * The catalogue filter a landing block asks for — the property carousel's auto
 * mode and the inventory band share it — and the catalogue URL that lists the
 * same properties ("See all N").
 *
 * The CMS shape (`filters` on the section, projected by
 * `landingPageSectionsProjection`) carries slugs, not references:
 * `{city, cities[], district, propertyType, propertyTypes[], deal, stage,
 * investment, minPrice, maxPrice, nearSea}`. Every field is optional, and
 * documents written before a field existed keep their behaviour.
 */

import type { CatalogFilters, CatalogSort, ConstructionStageFilter } from '@/types/catalog'
import { buildListingUrl } from '@/lib/routes/listingRoutes'
import { PUBLIC_DEAL_TYPES } from '@/lib/catalog/publicDealTypes'
import { LISTING_FACETS, LISTING_FACET_SLUGS, type ListingFacetSlug } from '@/lib/catalog/listingFacets'

export type LandingListingFilter = {
  city?: string
  cities?: string[]
  district?: string
  propertyType?: string
  propertyTypes?: string[]
  deal?: string
  stage?: ConstructionStageFilter
  investment?: boolean
  minPrice?: number
  maxPrice?: number
  nearSea?: boolean
}

/** The part of `CatalogFilters` a landing block can set. */
export type LandingListingScope = Pick<
  CatalogFilters,
  'city' | 'cities' | 'district' | 'type' | 'types' | 'deal' | 'stage' | 'investment' | 'minPrice' | 'maxPrice' | 'nearSea'
>

type PlaceContext = {
  linkedZone?: { type: 'district' | 'city'; slug?: string; citySlug?: string }
  citySlug?: string
}

const STAGES: readonly ConstructionStageFilter[] = ['off-plan', 'under-construction', 'completed', 'unfinished']

function slugOf(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim().toLowerCase()
  return s || undefined
}

function slugList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const item of v) {
    const s = slugOf(item)
    if (s && !out.includes(s)) out.push(s)
  }
  return out
}

function positive(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined
}

/** CMS `filters` object → a clean filter; unknown values are dropped, never guessed. */
export function normalizeLandingListingFilter(raw: unknown): LandingListingFilter {
  if (!raw || typeof raw !== 'object') return {}
  const f = raw as Record<string, unknown>
  const out: LandingListingFilter = {}
  const city = slugOf(f.city)
  if (city) out.city = city
  const cities = slugList(f.cities)
  if (cities.length) out.cities = cities
  const district = slugOf(f.district)
  if (district) out.district = district
  const propertyType = slugOf(f.propertyType)
  if (propertyType) out.propertyType = propertyType
  const propertyTypes = slugList(f.propertyTypes)
  if (propertyTypes.length) out.propertyTypes = propertyTypes
  const deal = slugOf(f.deal)
  if (deal) out.deal = deal
  const stage = slugOf(f.stage)
  if (stage && (STAGES as readonly string[]).includes(stage)) out.stage = stage as ConstructionStageFilter
  if (f.investment === true) out.investment = true
  const minPrice = positive(f.minPrice)
  if (minPrice) out.minPrice = minPrice
  const maxPrice = positive(f.maxPrice)
  if (maxPrice) out.maxPrice = maxPrice
  if (f.nearSea === true) out.nearSea = true
  return out
}

/**
 * Catalogue scope for a block, most specific first: places set on the section
 * win, otherwise the block follows the page — and on a district landing that
 * means the district, not its whole city. A block with no place and no filter
 * returns `null` (the carousel then shows the global top offers).
 *
 * `city` and `cities` merge: one city in total is a `city` scope (it has a
 * listing page of its own), several are an OR over `cities`.
 */
export function resolveLandingListingScope(
  filter: LandingListingFilter | undefined,
  ctx: PlaceContext = {},
): LandingListingScope | null {
  const f = filter ?? {}
  const base: LandingListingScope = {}
  if (f.propertyType) base.type = f.propertyType
  if (f.propertyTypes?.length) base.types = f.propertyTypes
  if (f.deal) base.deal = f.deal
  // A stage or investment filter is what turns a carousel into a new-builds
  // block, so it counts as scope on its own — without it the section would
  // fall through to the unfiltered top-offers branch and show finished flats.
  if (f.stage) base.stage = f.stage
  if (f.investment) base.investment = true
  if (f.minPrice) base.minPrice = f.minPrice
  if (f.maxPrice) base.maxPrice = f.maxPrice
  if (f.nearSea) base.nearSea = true

  if (f.district) return { ...base, district: f.district, ...(f.city ? { city: f.city } : {}) }

  const places = [...new Set([...(f.city ? [f.city] : []), ...(f.cities ?? [])])]
  if (places.length === 1) return { ...base, city: places[0] }
  if (places.length > 1) return { ...base, cities: places }

  const { linkedZone, citySlug } = ctx
  const pageCity = linkedZone?.citySlug ?? citySlug
  const pageDistrict = linkedZone?.type === 'district' ? linkedZone.slug : undefined
  const hasFilter = Object.keys(base).length > 0
  if (pageDistrict) return { ...base, district: pageDistrict, ...(pageCity ? { city: pageCity } : {}) }
  if (pageCity) return { ...base, city: pageCity }
  return hasFilter ? base : null
}

/** Sorts the catalogue's own sort control offers; anything else stays off the link. */
const LINKABLE_SORTS: readonly CatalogSort[] = ['priceAsc', 'priceDesc', 'areaAsc', 'areaDesc']

/** Non-path query of a scope, in the catalogue's own parameter names. */
export function landingScopeQuery(scope: LandingListingScope, sort?: CatalogSort): URLSearchParams {
  const q = new URLSearchParams()
  if (scope.cities?.length) q.set('cities', scope.cities.join(','))
  if (scope.types?.length) q.set('types', scope.types.join(','))
  if (scope.minPrice) q.set('minPrice', String(scope.minPrice))
  if (scope.maxPrice) q.set('maxPrice', String(scope.maxPrice))
  if (scope.nearSea) q.set('nearSea', '1')
  if (scope.stage) q.set('stage', scope.stage)
  if (scope.investment) q.set('investment', '1')
  if (sort && LINKABLE_SORTS.includes(sort)) q.set('sort', sort)
  return q
}

/** The facet whose query is exactly `q` (and nothing else), if any. */
function facetForQuery(q: URLSearchParams, type: string | undefined): ListingFacetSlug | undefined {
  const entries = [...q.entries()]
  if (type) entries.push(['type', type])
  return LISTING_FACET_SLUGS.find((slug) => {
    const fq = Object.entries(LISTING_FACETS[slug].query)
    return fq.length === entries.length && fq.every(([k, v]) => entries.some(([ek, ev]) => ek === k && ev === v))
  })
}

/**
 * The catalogue URL that lists exactly the properties of a scope: the city or
 * district listing (a facet path such as `/albania/durres/near-the-sea` when
 * the filter is one), else `/catalog` or the deal hub with the filter as query.
 * `countrySlug` is the city's country; without it the city path omits it.
 */
export function landingScopeCatalogHref(
  locale: string,
  scope: LandingListingScope,
  opts: { countrySlug?: string | null; sort?: CatalogSort } = {},
): string {
  const query = landingScopeQuery(scope, opts.sort)
  const country = opts.countrySlug?.trim() || undefined
  // A property type lives after the deal in a listing path (`/sale/apartment`);
  // with no deal set, the only public one stands in for it.
  const deal = scope.deal || (scope.type && PUBLIC_DEAL_TYPES.length === 1 ? PUBLIC_DEAL_TYPES[0] : undefined)
  if (scope.city && country) {
    const facet = facetForQuery(query, scope.type)
    if (facet) {
      return buildListingUrl({
        scope: 'catalog',
        locale,
        city: scope.city,
        trustedCityCountrySlug: country,
        district: scope.district,
        facet,
      })
    }
  }
  return buildListingUrl({
    scope: 'catalog',
    locale,
    city: scope.city,
    trustedCityCountrySlug: scope.city ? country : undefined,
    district: scope.district,
    dealQuery: deal,
    propertyType: scope.type,
    query,
  })
}
