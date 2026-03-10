import PropertyCard from '@/components/Home/Properties/Card/Card'
import { getProperties } from '@/data/properties'
import { PropertySearchBar } from '@/components/catalog/PropertySearchBar'
import { PropertyPagination } from '@/components/catalog/PropertyPagination'
import type { PropertyHomes } from '@/types/properyHomes'

type SearchParams = Record<string, string | string[] | undefined>

const DEFAULT_PAGE_SIZE = 24
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48]

function getCitySlug(location: string): string {
  const parts = location.split(',')
  const city = parts[parts.length - 1]?.trim() ?? ''
  return city.toLowerCase()
}

function getCityLabel(location: string): string {
  const parts = location.split(',')
  const city = parts[parts.length - 1]?.trim() ?? ''
  if (!city) return ''
  return city.charAt(0).toUpperCase() + city.slice(1)
}

function getTypeSlug(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('apartment')) return 'apartment'
  if (lower.includes('villa')) return 'villa'
  if (lower.includes('office')) return 'office'
  return 'other'
}

const DEAL_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'sale', label: 'Sale' },
  { value: 'rent', label: 'Rent' },
  { value: 'short-term', label: 'Short-term rent' },
]

const AMENITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'parking', label: 'Parking' },
  { value: 'pool', label: 'Pool' },
  { value: 'sea-view', label: 'Sea view' },
  { value: 'garden', label: 'Garden' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'terrace', label: 'Terrace' },
  { value: 'air-conditioning', label: 'Air conditioning' },
  { value: 'elevator', label: 'Elevator' },
]

const DEFAULT_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  any: { min: 50_000, max: 1_000_000 },
  sale: { min: 50_000, max: 1_000_000 },
  rent: { min: 300, max: 10_000 },
  'short-term': { min: 50, max: 2_000 },
}

const PropertiesListing: React.FC<{ locale: string; searchParams: SearchParams }> = ({
  locale,
  searchParams,
}) => {
  const allProperties = getProperties()

  // derive options for selects from current dataset (fallback until Sanity wiring)
  const cityMap = new Map<string, string>()
  const typeMap = new Map<string, string>()
  allProperties.forEach((p) => {
    const citySlug = getCitySlug(p.location)
    const cityLabel = getCityLabel(p.location)
    if (citySlug && cityLabel && !cityMap.has(citySlug)) {
      cityMap.set(citySlug, cityLabel)
    }
    const typeSlug = getTypeSlug(p.name)
    if (typeSlug === 'apartment') typeMap.set('apartment', 'Apartment')
    if (typeSlug === 'villa') typeMap.set('villa', 'Villa')
    if (typeSlug === 'office') typeMap.set('office', 'Office')
  })
  const locationOptions = Array.from(cityMap.entries()).map(([value, label]) => ({
    value,
    label,
  }))
  const typeOptions = Array.from(typeMap.entries()).map(([value, label]) => ({
    value,
    label,
  }))

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

  const filtered: PropertyHomes[] = allProperties.filter((p) => {
    if (cityFilter) {
      if (getCitySlug(p.location) !== cityFilter) return false
    }
    if (typeFilter) {
      if (getTypeSlug(p.name) !== typeFilter) return false
    }
    // dealFilter пока не влияет на сами объекты, т.к. mock-данные не содержат status
    if (minPriceFilter || maxPriceFilter) {
      const numericRate = Number(String(p.rate).replace(/,/g, '')) || 0
      if (minPriceFilter && numericRate < minPriceFilter) return false
      if (maxPriceFilter && numericRate > maxPriceFilter) return false
    }
    if (bedsFilter && p.beds < bedsFilter) return false
    return true
  })

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const rawPage =
    typeof searchParams.page === 'string' ? Number(searchParams.page) || 1 : 1
  const currentPage = Math.min(Math.max(rawPage, 1), totalPages)
  // apply sort
  const sorted = [...filtered]
  if (sort === 'priceAsc' || sort === 'priceDesc') {
    sorted.sort((a, b) => {
      const aPrice = Number(String(a.rate).replace(/,/g, '')) || 0
      const bPrice = Number(String(b.rate).replace(/,/g, '')) || 0
      return sort === 'priceAsc' ? aPrice - bPrice : bPrice - aPrice
    })
  } else if (sort === 'areaDesc') {
    sorted.sort((a, b) => (b.area || 0) - (a.area || 0))
  }

  const start = (currentPage - 1) * pageSize
  const pageItems = sorted.slice(start, start + pageSize)

  return (
    <section className='pt-0!'>
      <div className='container max-w-8xl mx-auto px-5 2xl:px-0'>
        <PropertySearchBar
          locations={locationOptions}
          propertyTypes={typeOptions}
          dealTypes={DEAL_TYPE_OPTIONS}
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
          amenityOptions={AMENITY_OPTIONS}
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
        <PropertyPagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </section>
  )
}

export default PropertiesListing

