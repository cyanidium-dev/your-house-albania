import PropertyCard from '@/components/Home/Properties/Card/Card'
import { PropertySearchBar } from '@/components/catalog/PropertySearchBar'
import { PropertyPagination } from '@/components/catalog/PropertyPagination'
import type { PropertyHomes } from '@/types/properyHomes'
import {
  fetchCatalogProperties,
  fetchCatalogFilterOptions,
  type CatalogSort,
} from '@/lib/sanity/client'
import { mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter'

type SearchParams = Record<string, string | string[] | undefined>

const DEFAULT_PAGE_SIZE = 24
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48]

const DEAL_TYPE_VALUES = ['sale', 'rent', 'short-term'] as const

const DEFAULT_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  any: { min: 50_000, max: 1_000_000 },
  sale: { min: 50_000, max: 1_000_000 },
  rent: { min: 300, max: 10_000 },
  'short-term': { min: 50, max: 2_000 },
}

async function PropertiesListing({
  locale,
  searchParams,
}: {
  locale: string
  searchParams: SearchParams
}) {
  const {
    locations: locationOptions,
    propertyTypes: typeOptions,
    amenities: amenityOptions,
    districts: districtOptions,
  } = await fetchCatalogFilterOptions(locale)

  const cityFilter =
    typeof searchParams.city === 'string' ? searchParams.city.toLowerCase() : ''
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
  const bedsFilter =
    typeof searchParams.beds === 'string' ? Number(searchParams.beds) || 0 : 0

  const rawPage =
    typeof searchParams.page === 'string' ? Number(searchParams.page) || 1 : 1
  let catalogResult =
    (await fetchCatalogProperties({
      city: cityFilter || undefined,
      district:
        typeof searchParams.district === 'string'
          ? searchParams.district
          : undefined,
      type: typeFilter || undefined,
      deal: dealFilter || undefined,
      minPrice: minPriceFilter || undefined,
      maxPrice: maxPriceFilter || undefined,
      beds: bedsFilter || undefined,
      amenities: amenitiesFilter.length ? amenitiesFilter : undefined,
      sort: sort as CatalogSort,
      page: rawPage,
      pageSize,
    })) ?? { items: [], totalCount: 0 }

  const totalItems = catalogResult.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(rawPage, 1), totalPages)

  // If requested page is out of range but there are items, refetch for the last valid page.
  if (totalItems > 0 && currentPage !== rawPage) {
    catalogResult =
      (await fetchCatalogProperties({
        city: cityFilter || undefined,
        district:
          typeof searchParams.district === 'string'
            ? searchParams.district
            : undefined,
        type: typeFilter || undefined,
        deal: dealFilter || undefined,
        minPrice: minPriceFilter || undefined,
        maxPrice: maxPriceFilter || undefined,
        beds: bedsFilter || undefined,
        amenities: amenitiesFilter.length ? amenitiesFilter : undefined,
        sort: sort as CatalogSort,
        page: currentPage,
        pageSize,
      })) ?? { items: [], totalCount }
  }

  const pageItems: PropertyHomes[] = Array.isArray(catalogResult.items)
    ? catalogResult.items.map((item) => mapCatalogPropertyToCard(item, locale))
    : []

  return (
    <section className='pt-0!'>
      <div className='container max-w-8xl mx-auto px-5 2xl:px-0'>
        <PropertySearchBar
          locations={locationOptions}
          propertyTypes={typeOptions}
          dealTypeValues={DEAL_TYPE_VALUES}
          districtOptions={districtOptions}
          priceRangesByDeal={DEFAULT_PRICE_RANGES}
          initialCity={cityFilter}
          initialType={typeFilter}
          initialDealType={dealFilter}
          initialMinPrice={
            typeof searchParams.minPrice === 'string' ? searchParams.minPrice : ''
          }
          initialMaxPrice={
            typeof searchParams.maxPrice === 'string' ? searchParams.maxPrice : ''
          }
          initialBeds={typeof searchParams.beds === 'string' ? searchParams.beds : ''}
          initialDistrict={
            typeof searchParams.district === 'string' ? searchParams.district : ''
          }
          initialSort={sort}
          amenityOptions={amenityOptions}
          initialAmenities={amenitiesFilter}
          initialPageSize={String(pageSize)}
        />
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10'>
          {pageItems.map((item, index) => (
            <div key={index} className=''>
              <PropertyCard item={item} locale={locale} />
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <PropertyPagination currentPage={currentPage} totalPages={totalPages} />
        )}
      </div>
    </section>
  )
}

export default PropertiesListing

