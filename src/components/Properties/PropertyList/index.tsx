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
  fetchSelectedPropertyCatalogBanners,
  fetchSiteSettings,
  fetchCatalogAreaBoundsFromData,
  fetchCityCountrySlugByCitySlug,
  type CatalogSort,
} from '@/lib/sanity/client'
import { mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter'
import { resolvePriceRange, toRangesByDeal } from '@/lib/catalog/priceRanges'
import { resolveAreaRangeBounds } from '@/lib/catalog/areaRanges'
import { parseCatalogFilters } from '@/lib/catalog/parseCatalogFilters'
import { buildListingUrl } from '@/lib/routes/listingRoutes'

type SearchParams = Record<string, string | string[] | undefined>

const DEFAULT_PAGE_SIZE = 24
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48]

const DEAL_TYPE_VALUES = ['sale', 'rent', 'short-term'] as const

type CatalogSeoContent = {
  bottomText?: unknown[]
} | null

async function PropertiesListing({
  locale,
  pathAgentSlug = '',
  pathCity = '',
  pathDistrict = '',
  /** Country segment from URL on geo routes; otherwise derived from Sanity `city.country`. */
  pathCountrySlug = '',
  /** When the listing URL omits a country segment (`/{locale}/{city}/…`); do not inject CMS country into canonical URLs. */
  omitCountryInPath = false,
  searchParams,
  catalogSeo,
}: {
  locale: string
  pathAgentSlug?: string
  pathCity?: string
  pathDistrict?: string
  pathCountrySlug?: string
  omitCountryInPath?: boolean
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

  const parsedFilters = parseCatalogFilters(
    {
      agentSlug: pathAgentSlug || undefined,
      city: pathCity || undefined,
      district: pathDistrict || undefined,
    },
    searchParams
  )
  const agentSlugFilter = parsedFilters.agentSlug
  const cityFilter = parsedFilters.city
  const districtFilter = parsedFilters.district
  const typeFilter = parsedFilters.type
  const dealFilter = parsedFilters.deal
  const sort = parsedFilters.sort
  const amenitiesFilter = parsedFilters.amenities
  const pageSizeRaw = parsedFilters.pageSize || DEFAULT_PAGE_SIZE
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeRaw) ? pageSizeRaw : DEFAULT_PAGE_SIZE
  const minPriceFilter = parsedFilters.minPrice
  const maxPriceFilter = parsedFilters.maxPrice
  const minAreaFilter = parsedFilters.minArea
  const maxAreaFilter = parsedFilters.maxArea
  const bedsFilter = parsedFilters.beds
  const viewMode = parseViewMode(searchParams.view)

  const rawPage = parsedFilters.page

  let initialCountrySlug = pathCountrySlug.trim()
  if (cityFilter && !initialCountrySlug && !omitCountryInPath) {
    initialCountrySlug = (await fetchCityCountrySlugByCitySlug(cityFilter)) || ''
  }

  const locationCountrySlugForCity = cityFilter
    ? locationOptions.find((l) => l.value.toLowerCase() === cityFilter.toLowerCase())?.countrySlug
    : undefined

  // --- Catalog banners (siteSettings.propertySettings.propertyCatalogBanners) ---
  const selectedBanners = await fetchSelectedPropertyCatalogBanners({
    locale,
    filters: {
      agentSlug: agentSlugFilter || undefined,
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
    },
    limit: 3,
  })
  const excludedBannerPropertyIds = selectedBanners.map((x) => x.propertyId)

  const catalogResult =
    (await fetchCatalogProperties({
      agentSlug: agentSlugFilter || undefined,
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
      // Critical: exclusion is applied in query before ordering/slicing (page-size safe).
      excludedPropertyIds: excludedBannerPropertyIds.length ? excludedBannerPropertyIds : undefined,
    })) ?? { items: [], totalCount: 0 }

  const filteredResults = catalogResult.items ?? []
  let filteredForDisplay = filteredResults

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

    const url = buildListingUrl({
      scope: agentSlugFilter ? 'agent' : 'catalog',
      locale,
      agentSlug: agentSlugFilter || undefined,
      country: omitCountryInPath ? undefined : initialCountrySlug || undefined,
      trustedCityCountrySlug: omitCountryInPath ? undefined : locationCountrySlugForCity,
      city: pathCity || undefined,
      dealQuery: dealFilter && dealFilter !== '' ? dealFilter : undefined,
      propertyType: typeFilter || undefined,
      district: pathDistrict || undefined,
      query: params,
    })
    redirect(url)
  }

  const pageItems: PropertyHomes[] = Array.isArray(filteredForDisplay)
    ? filteredForDisplay.map((item) => mapCatalogPropertyToCard(item, locale))
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
    initialAgentSlug: agentSlugFilter || '',
    initialCountrySlug,
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
            banners={selectedBanners}
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

