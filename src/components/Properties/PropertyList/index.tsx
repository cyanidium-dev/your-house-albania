import { redirect } from 'next/navigation'
import { CatalogBodyClient } from '@/components/catalog/CatalogBodyClient'
import { CatalogSeoText } from '@/components/catalog/CatalogSeoText'
import { CatalogViewProvider } from '@/contexts/CatalogViewContext'
import { ItemListJsonLd } from '@/components/shared/ItemListJsonLd'
import { getBaseUrl } from '@/lib/seo/baseUrl'
import type { PropertyHomes } from '@/types/propertyHomes'
import { parseViewMode } from '@/lib/catalog/viewMode'
import {
  fetchCatalogProperties,
  fetchCatalogFilterOptions,
  fetchSiteSettings,
  fetchCatalogAreaBoundsFromData,
  fetchFeaturedProperties,
  type CatalogSort,
} from '@/lib/sanity/client'
import { mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter'
import { resolvePriceRange, toRangesByDeal } from '@/lib/catalog/priceRanges'
import { resolveAreaRangeBounds } from '@/lib/catalog/areaRanges'

type SearchParams = Record<string, string | string[] | undefined>

const DEFAULT_PAGE_SIZE = 24
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48]

const DEAL_TYPE_VALUES = ['sale', 'rent', 'short-term'] as const

function resolveMaxFeaturedProperties(settings: unknown): number {
  const raw = (settings as { maxFeaturedProperties?: unknown })?.maxFeaturedProperties
  if (raw === null || raw === undefined) return 6
  const n =
    typeof raw === 'number' && Number.isFinite(raw)
      ? Math.floor(raw)
      : typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))
        ? Math.floor(Number(raw))
        : NaN
  if (Number.isNaN(n) || n < 0) return 6
  return Math.min(n, 48)
}

type CatalogSeoContent = {
  bottomText?: unknown[]
} | null

async function PropertiesListing({
  locale,
  pathCity = '',
  pathDistrict = '',
  searchParams,
  catalogSeo,
}: {
  locale: string
  pathCity?: string
  pathDistrict?: string
  searchParams: SearchParams
  catalogSeo?: CatalogSeoContent
}) {
  const [filterOptions, siteSettings, areaBoundsFromData] = await Promise.all([
    fetchCatalogFilterOptions(locale),
    fetchSiteSettings(),
    fetchCatalogAreaBoundsFromData(),
  ])
  const {
    locations: locationOptions,
    propertyTypes: typeOptions,
    amenities: amenityOptions,
    districts: districtOptions,
  } = filterOptions
  const priceRangesByDeal = toRangesByDeal(
    resolvePriceRange((siteSettings as Record<string, unknown>)?.priceRange)
  )
  const defaultAreaRange = resolveAreaRangeBounds(
    (siteSettings as Record<string, unknown>)?.areaRange,
    areaBoundsFromData
  )

  const cityFilter = (pathCity || (typeof searchParams.city === 'string' ? searchParams.city : '')).toLowerCase()
  const districtFilter =
    pathDistrict ||
    (typeof searchParams.district === 'string' ? searchParams.district : '')
  const typeFilter =
    typeof searchParams.type === 'string' ? searchParams.type.toLowerCase() : ''
  const dealFilter =
    typeof searchParams.deal === 'string' ? searchParams.deal.toLowerCase() : ''
  const sort =
    typeof searchParams.sort === 'string' ? searchParams.sort : 'newest'
  const amenitiesFilter =
    typeof searchParams.amenities === 'string' && searchParams.amenities.trim()
      ? searchParams.amenities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  const pageSizeRaw =
    typeof searchParams.pageSize === 'string' ? Number(searchParams.pageSize) || DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeRaw) ? pageSizeRaw : DEFAULT_PAGE_SIZE
  const minPriceFilter =
    typeof searchParams.minPrice === 'string' ? Number(searchParams.minPrice) || 0 : 0
  const maxPriceFilter =
    typeof searchParams.maxPrice === 'string' ? Number(searchParams.maxPrice) || 0 : 0
  const minAreaFilter =
    typeof searchParams.minArea === 'string' ? Number(searchParams.minArea) || 0 : 0
  const maxAreaFilter =
    typeof searchParams.maxArea === 'string' ? Number(searchParams.maxArea) || 0 : 0
  const bedsFilter =
    typeof searchParams.beds === 'string' ? Number(searchParams.beds) || 0 : 0
  const viewMode = parseViewMode(searchParams.view)

  const rawPage =
    typeof searchParams.page === 'string' ? Number(searchParams.page) || 1 : 1

  const maxFeatured = resolveMaxFeaturedProperties(siteSettings)
  const featuredPromoFetched =
    maxFeatured > 0 ? await fetchFeaturedProperties(maxFeatured) : null
  const featuredPromoRaw = Array.isArray(featuredPromoFetched)
    ? featuredPromoFetched
    : []
  const promoIdSet = new Set(
    featuredPromoRaw
      .map((p) => p._id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  )

  const catalogResult =
    (await fetchCatalogProperties({
      city: cityFilter || undefined,
      district: districtFilter || undefined,
      type: typeFilter || undefined,
      deal: dealFilter || undefined,
      minPrice: minPriceFilter || undefined,
      maxPrice: maxPriceFilter || undefined,
      minArea: minAreaFilter || undefined,
      maxArea: maxAreaFilter || undefined,
      beds: bedsFilter || undefined,
      amenities: amenitiesFilter.length ? amenitiesFilter : undefined,
      sort: sort as CatalogSort,
      page: rawPage,
      pageSize,
    })) ?? { items: [], totalCount: 0 }

  const filteredResults = catalogResult.items ?? []
  let filteredForDisplay =
    rawPage === 1
      ? filteredResults.filter(
          (item) =>
            typeof item._id === 'string' && !promoIdSet.has(item._id)
        )
      : filteredResults

  {
    const seen = new Set<string>()
    filteredForDisplay = filteredForDisplay.filter((item) => {
      if (typeof item._id !== 'string') return true
      if (seen.has(item._id)) return false
      seen.add(item._id)
      return true
    })
  }

  const totalItems = catalogResult.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(rawPage, 1), totalPages)

  // If requested page is out of range but there are items, redirect to valid page (avoids duplicate fetch).
  if (totalItems > 0 && currentPage !== rawPage) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      if (v === undefined) continue
      if (Array.isArray(v)) {
        for (const item of v) {
          if (typeof item === 'string') params.append(k, item)
        }
      } else if (typeof v === 'string') {
        params.set(k, v)
      }
    }
    params.set('page', String(currentPage))
    const qs = params.toString()
    const path = `/${locale}/properties` +
      (pathCity ? `/${encodeURIComponent(pathCity)}` : '') +
      (pathDistrict ? `/${encodeURIComponent(pathDistrict)}` : '')
    redirect(path + (qs ? `?${qs}` : ''))
  }

  const pageItems: PropertyHomes[] = Array.isArray(filteredForDisplay)
    ? filteredForDisplay.map((item) => mapCatalogPropertyToCard(item, locale))
    : []

  const promoItems: PropertyHomes[] =
    rawPage === 1 && featuredPromoRaw.length > 0
      ? featuredPromoRaw.map((item) => mapCatalogPropertyToCard(item, locale))
      : []

  const baseUrl = await getBaseUrl()
  const itemListEntries = pageItems.map((item) => ({
    name: item.name,
    slug: item.slug,
    image: item.images?.[0]?.src ?? null,
  }))

  const filterProps = {
    locations: locationOptions,
    propertyTypes: typeOptions,
    dealTypeValues: DEAL_TYPE_VALUES,
    districtOptions,
    priceRangesByDeal,
    defaultAreaRange,
    amenityOptions,
    initialCity: cityFilter || '',
    initialType: typeFilter,
    initialDealType: dealFilter,
    initialMinPrice: typeof searchParams.minPrice === 'string' ? searchParams.minPrice : '',
    initialMaxPrice: typeof searchParams.maxPrice === 'string' ? searchParams.maxPrice : '',
    initialMinArea: typeof searchParams.minArea === 'string' ? searchParams.minArea : '',
    initialMaxArea: typeof searchParams.maxArea === 'string' ? searchParams.maxArea : '',
    initialBeds: typeof searchParams.beds === 'string' ? searchParams.beds : '',
    initialDistrict: districtFilter,
    initialSort: sort,
    initialAmenities: amenitiesFilter,
    initialPageSize: String(pageSize),
    initialView: viewMode,
  }

  return (
    <section className='pt-0!'>
      {pageItems.length > 0 && (
        <ItemListJsonLd items={itemListEntries} baseUrl={baseUrl} locale={locale} />
      )}
      <div className='container max-w-8xl mx-auto px-5 2xl:px-0 overflow-x-clip'>
        <CatalogViewProvider initialView={viewMode}>
          <CatalogBodyClient
            filterProps={filterProps}
            pageItems={pageItems}
            promoItems={promoItems}
            locale={locale}
            totalPages={totalPages}
            currentPage={currentPage}
          />
        </CatalogViewProvider>
        {catalogSeo?.bottomText && catalogSeo.bottomText.length > 0 && (
          <CatalogSeoText content={catalogSeo.bottomText} />
        )}
      </div>
    </section>
  )
}

export default PropertiesListing

