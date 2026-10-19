import type { ReactNode } from 'react'
import { permanentRedirect } from 'next/navigation'
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
import { attachMarketPositionToCards } from '@/lib/property/marketPosition'
import { resolvePriceRange, toRangesByDeal } from '@/lib/catalog/priceRanges'
import { resolveAreaRangeBounds } from '@/lib/catalog/areaRanges'
import { parseCatalogFilters } from '@/lib/catalog/parseCatalogFilters'
import { buildListingUrl } from '@/lib/routes/listingRoutes'
import { PUBLIC_DEAL_TYPES } from '@/lib/catalog/publicDealTypes'
import { propertyCardCanonicalCoverUrl } from '@/lib/property/propertyCardImages'
import { getTranslations } from 'next-intl/server'
import { LISTINGS_ANCHOR_ID } from '@/lib/routes/currentCityListing'
import { telegramBotUrl, telegramBotUsername } from '@/lib/contacts/messengerLinks'
import { buildSearchStartPayload } from '@/lib/telegram/startPayload'
import { buildSelectionCriteria } from '@/lib/catalog/selectionRequest'

type SearchParams = Record<string, string | string[] | undefined>

const DEFAULT_PAGE_SIZE = 24
/** The Telegram search-alert block in the catalogue; see the note where it is built. */
const SEARCH_ALERTS_IN_CATALOG = false
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48]

// Public deal filter options: rentals hidden from the UI (direct URLs keep working).
const DEAL_TYPE_VALUES = PUBLIC_DEAL_TYPES

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
  urlSearch,
  catalogSeo,
  heading,
  headingLead,
  afterFilters,
}: {
  locale: string
  pathAgentSlug?: string
  pathCity?: string
  pathDistrict?: string
  pathCountrySlug?: string
  omitCountryInPath?: boolean
  searchParams: SearchParams
  /**
   * The query exactly as it stands in the URL — `searchParams` above may also
   * carry what the path says (city, type, facet). Pagination links are built
   * from it on the server; omitted, they start from an empty query and the
   * browser's own takes over after hydration.
   */
  urlSearch?: SearchParams
  catalogSeo?: CatalogSeoContent
  /**
   * Names the place so the card grid sits under an `<h2>` with the live count
   * ("Apartments and property for sale in Durrës: 358 listings"). `filtered`
   * when the page shows a slice or a filtered result rather than the place's
   * whole stock. Also titles the bottom text when that has no heading.
   * The national hub has no place to name and passes its two lines ready-made.
   */
  heading?: { place: string; placeIn: string; filtered: boolean } | { text: (count: number) => string; aboutText: string }
  /** One sentence of figures under the heading (lib/catalog/placeAnswer). */
  headingLead?: string
  /** Rendered between the filter bar and the card grid: the place's facet chips. */
  afterFilters?: ReactNode
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
  const bedsExactFilter = parsedFilters.bedsExact
  const typesFilter = parsedFilters.types
  const nearSeaFilter = parsedFilters.nearSea
  const citiesFilter = parsedFilters.cities
  const stageFilter = parsedFilters.stage
  const investmentFilter = parsedFilters.investment
  const viewMode = parseViewMode(searchParams.view)

  // "New listings for this search in Telegram": the search goes into the
  // bot's Start payload (src/lib/telegram/bot/search.ts). Not on an agent's
  // page — the subscription is to the market, not to one agent's stock.
  // Off since 2026-10-19 (owner's call): listings arrive in partner batches
  // of a hundred or more about once a month, prices never move, and the DE,
  // PL and IT visitors are not on Telegram — the block took the space above
  // the cards for one message a month. The bot still honours `s_` links.
  const botUsername = SEARCH_ALERTS_IN_CATALOG ? telegramBotUsername() : null
  const searchAlertPayload =
    botUsername && !agentSlugFilter
      ? buildSearchStartPayload({
          locale,
          filters: {
            city: cityFilter || undefined,
            cities: citiesFilter.length ? citiesFilter : undefined,
            district: districtFilter || undefined,
            type: typeFilter || undefined,
            types: typesFilter.length ? typesFilter : undefined,
            deal: dealFilter || undefined,
            stage: stageFilter || undefined,
            minPrice: minPriceFilter || undefined,
            maxPrice: maxPriceFilter || undefined,
            minArea: minAreaFilter || undefined,
            maxArea: maxAreaFilter || undefined,
            beds: bedsFilter || undefined,
            bedsExact: bedsExactFilter || undefined,
            nearSea: nearSeaFilter || undefined,
            investment: investmentFilter || undefined,
          },
        })
      : null
  const searchAlertHref = botUsername && searchAlertPayload ? telegramBotUrl(botUsername, searchAlertPayload) : null

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
      cities: citiesFilter.length ? citiesFilter : undefined,
      district: districtFilter || undefined,
      type: typeFilter || undefined,
      deal: dealFilter || undefined,
      minPrice: minPriceFilter || undefined,
      maxPrice: maxPriceFilter || undefined,
      minArea: minAreaFilter || undefined,
      maxArea: maxAreaFilter || undefined,
      beds: bedsFilter || undefined,
      bedsExact: bedsExactFilter || undefined,
      types: typesFilter.length ? typesFilter : undefined,
      nearSea: nearSeaFilter || undefined,
      amenities: amenitiesFilter.length ? amenitiesFilter : undefined,
      stage: stageFilter || undefined,
      investment: investmentFilter || undefined,
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
  // Permanent: `?page=999` is never going to be a page of its own, and a 307
  // kept the address alive (audit 2026-10-18, T L-4). Page one is the bare URL.
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
    if (currentPage > 1) params.set('page', String(currentPage))
    else params.delete('page')

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
    permanentRedirect(url)
  }

  const pageItemsBase: PropertyHomes[] = Array.isArray(filteredForDisplay)
    ? filteredForDisplay.map((item) => mapCatalogPropertyToCard(item, locale))
    : []
  const pageItems = await attachMarketPositionToCards(pageItemsBase)

  // Load-more asks the API for page 2+ with exactly the filters this page
  // resolved — path facets included. It used to read `window.location.search`,
  // which on `/albania/durres` holds no city, so scrolling the Durrës listing
  // appended page 2 of the whole country.
  const loadMoreQuery = new URLSearchParams(
    Object.entries({
      agent: agentSlugFilter,
      city: cityFilter,
      cities: citiesFilter.join(','),
      district: districtFilter,
      type: typeFilter,
      types: typesFilter.join(','),
      deal: dealFilter,
      minPrice: minPriceFilter,
      maxPrice: maxPriceFilter,
      minArea: minAreaFilter,
      maxArea: maxAreaFilter,
      beds: bedsFilter,
      bedsExact: bedsExactFilter,
      nearSea: nearSeaFilter ? '1' : '',
      amenities: amenitiesFilter.join(','),
      stage: stageFilter,
      investment: investmentFilter ? '1' : '',
      sort,
      pageSize,
    })
      .filter(([, v]) => v !== '' && v !== 0 && v != null)
      .map(([k, v]) => [k, String(v)]),
  ).toString()

  const serverSearch = new URLSearchParams(
    Object.entries(urlSearch ?? {}).flatMap(([k, v]) =>
      typeof v === 'string' ? [[k, v]] : Array.isArray(v) ? v.map((item) => [k, item]) : [],
    ),
  ).toString()

  const baseUrl = await getBaseUrl()
  const itemListEntries = pageItems.map((item) => ({
    name: item.name,
    slug: item.slug,
    href: item._href,
    // The same single variant the listing's page and the image sitemap publish.
    image: propertyCardCanonicalCoverUrl(item),
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
    initialStage: stageFilter,
    initialNearSea: !!nearSeaFilter,
    initialBedsExact: bedsExactFilter ? String(bedsExactFilter) : '',
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
    // Open by default since 2026-09-29: a page that opened on the condensed
    // pill read as a search box, and the owner could not tell it hid filters.
    collapsedByDefault: false,
  }

  // "We'll send a selection by your criteria", shown from page 2 (the client
  // decides when; see showsSelectionBlock). The filters go along twice: as
  // chips for the visitor and as plain lines for the operator.
  const [tCapture, tQuickLead, tBot, tDeal] = await Promise.all([
    getTranslations({ locale, namespace: 'Capture.selection' }),
    getTranslations({ locale, namespace: 'QuickLead' }),
    getTranslations({ locale, namespace: 'TelegramBot.search' }),
    getTranslations({ locale, namespace: 'Shared.propertyDetail' }),
  ])
  const eurFormat = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  const dealLabelKey =
    dealFilter === 'sale' ? 'dealTypeSale' : dealFilter === 'rent' ? 'dealTypeRent' : dealFilter === 'short-term' ? 'dealTypeShortTerm' : null
  const labelOf = (options: Array<{ value: string; label: string }>, value: string) =>
    options.find((o) => o.value.toLowerCase() === value.toLowerCase())?.label
  const selectionCriteria = buildSelectionCriteria(
    {
      city: cityFilter ? { slug: cityFilter, label: labelOf(locationOptions, cityFilter) } : undefined,
      district: districtFilter ? { slug: districtFilter, label: labelOf(districtOptions, districtFilter) } : undefined,
      type: typeFilter ? { slug: typeFilter, label: labelOf(typeOptions, typeFilter) } : undefined,
      deal: dealFilter ? { value: dealFilter, label: dealLabelKey ? tDeal(dealLabelKey) : undefined } : undefined,
      minPrice: minPriceFilter || undefined,
      maxPrice: maxPriceFilter || undefined,
      beds: bedsFilter || undefined,
      bedsExact: bedsExactFilter || undefined,
    },
    {
      money: (n) => eurFormat.format(n),
      priceRange: (from, to) => tQuickLead('budgetRange', { from, to }),
      priceUpTo: (amount) => tQuickLead('budgetUpTo', { amount }),
      priceOver: (amount) => tQuickLead('budgetOver', { amount }),
      bedsFrom: (n) => tBot('bedsFrom', { n }),
      bedsExact: (n) => tBot('bedsExact', { n }),
    },
  )
  const selection = agentSlugFilter
    ? undefined
    : {
        title: tCapture('title'),
        criteriaLabel: tCapture('criteria'),
        chips: selectionCriteria.chips,
        message: selectionCriteria.message,
      }

  const tDepth = heading && !('text' in heading) ? await getTranslations({ locale, namespace: 'Catalog.depth' }) : null
  const headingText = !heading
    ? ''
    : 'text' in heading
      ? heading.text(totalItems)
      : tDepth
        ? tDepth(heading.filtered ? 'listingsHeadingFiltered' : 'listingsHeading', {
            place: heading.place,
            placeIn: heading.placeIn,
            count: totalItems,
          })
        : ''
  const aboutHeading = !heading
    ? undefined
    : 'text' in heading
      ? heading.aboutText
      : tDepth?.('aboutTitle', { place: heading.place, placeIn: heading.placeIn })

  return (
    <section className='pt-0!'>
      {pageItems.length > 0 && (
        <ItemListJsonLd
          items={itemListEntries}
          baseUrl={baseUrl}
          locale={locale}
          // A place page (city, district): the list is "listings in <place>".
          collection={
            headingText && heading && !('text' in heading)
              ? { name: headingText, placeName: heading.place }
              : null
          }
        />
      )}
      <div className='container max-w-8xl mx-auto px-5 2xl:px-0 overflow-x-clip'>
        {headingText && totalItems > 0 ? (
          <>
          <h2
            id={LISTINGS_ANCHOR_ID}
            className='scroll-mt-28 pt-6 text-dark dark:text-white text-xl md:text-2xl font-semibold'
          >
            {headingText}
          </h2>
            {headingLead ? (
              <p className='mt-2 max-w-3xl text-base text-dark/75 dark:text-white/75'>{headingLead}</p>
            ) : null}
          </>
        ) : null}
        <CatalogViewProvider initialView={viewMode}>
          <CatalogBodyClient
            filterProps={filterProps}
            pageItems={pageItems}
            banners={selectedBanners}
            locale={locale}
            totalPages={totalPages}
            currentPage={currentPage}
            totalCount={totalItems}
            pageSize={pageSize}
            loadMoreQuery={loadMoreQuery}
            searchAlertHref={searchAlertHref}
            serverSearch={serverSearch}
            afterFilters={afterFilters}
            selection={selection}
          />
        </CatalogViewProvider>
        {catalogSeo?.bottomText && catalogSeo.bottomText.length > 0 && (
          <CatalogSeoText
            content={catalogSeo.bottomText}
            heading={aboutHeading}
          />
        )}
      </div>
    </section>
  )
}

export default PropertiesListing

