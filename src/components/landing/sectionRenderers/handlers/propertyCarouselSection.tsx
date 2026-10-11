import * as React from 'react'
import type { PropertyHomes } from '@/types/propertyHomes'
import PropertyCarouselSection from '@/components/landing/sections/impl/PropertyCarouselSectionImpl'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import {
  fetchHomeTopOffers,
  fetchCatalogProperties,
  type CatalogProperty,
  type HomeTopOffersSort,
} from '@/lib/sanity/client'
import { mapCatalogPropertyToCard, mapSanityPropertyToCard } from '@/lib/sanity/propertyAdapter'
import { attachMarketPositionToCards } from '@/lib/property/marketPosition'
import { fetchCityCountrySlugByCitySlug } from '@/lib/sanity/client'
import {
  landingScopeCatalogHref,
  normalizeLandingListingFilter,
  resolveLandingListingScope,
} from '@/lib/landing/listingFilter'
import type { CatalogSort } from '@/types/catalog'
import type { SectionHandler } from './types'

export const propertyCarouselSectionHandler: SectionHandler = async ({
  locale,
  section,
  citySlug,
  linkedZone,
}) => {
  if (section.enabled === false) return null

  const debug = process.env.NODE_ENV === 'development'
  if (debug) {
    console.log('[Landing][propertyCarouselSection] start', {
      locale,
      key: section?._key,
      mode: section?.mode ?? 'auto',
      hasSelectedProps: Array.isArray(section?.properties) ? section.properties.length : 0,
      citySlug: citySlug ?? null,
      linkedZone: linkedZone ?? null,
    })
  }

  const propertiesData = {
    badge: resolveLocalizedString(section.shortLine as never, locale) || undefined,
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    description: resolveLocalizedString(section.subtitle as never, locale) || undefined,
  }

  const mode = section.mode ?? 'auto'
  // `autoMode` overrides exist in the schema and were previously never read.
  const autoMode = (section as { autoMode?: { limit?: unknown; sort?: unknown } }).autoMode
  const requestedLimitRaw = Number(
    (mode !== 'selected' && autoMode?.limit) ?? (section as { limit?: unknown } | null)?.limit,
  )
  const requestedLimit =
    Number.isFinite(requestedLimitRaw) && requestedLimitRaw > 0
      ? Math.min(Math.floor(requestedLimitRaw), 48)
      : 24
  const requestedSortRaw = String(
    (mode !== 'selected' && autoMode?.sort) ?? (section as { sort?: unknown } | null)?.sort ?? 'newest',
  )
  const sortAsGroup =
    requestedSortRaw === 'popular' || requestedSortRaw === 'new' || requestedSortRaw === 'highDemand'
      ? requestedSortRaw
      : undefined
  const requestedSort: HomeTopOffersSort =
    requestedSortRaw === 'priceAsc' ||
    requestedSortRaw === 'priceDesc' ||
    requestedSortRaw === 'areaAsc' ||
    requestedSortRaw === 'areaDesc'
      ? requestedSortRaw
      : 'newest'
  // €/m² exists for the filtered catalogue query only (the top-offer groups
  // and a hand-picked list keep their own orders).
  const scopedSort: CatalogSort =
    requestedSortRaw === 'pricePerSqmAsc' ? 'pricePerSqmAsc' : requestedSort

  /** "See all N" under a filtered feed: the catalogue page with the same filter. */
  let seeAll: { href: string; count: number } | null = null

  let propertyItems: PropertyHomes[] | null = null
  let topOffersGroups: { popular: PropertyHomes[]; new: PropertyHomes[]; highDemand: PropertyHomes[] } | null = null

  if (mode === 'selected' && Array.isArray(section.properties) && section.properties.length > 0) {
    const mapped = section.properties.map((prop) => mapSanityPropertyToCard(prop as never, locale))
    const sorted = [...mapped]
    if (requestedSort === 'priceAsc') sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    else if (requestedSort === 'priceDesc') sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity))
    else if (requestedSort === 'areaAsc') sorted.sort((a, b) => (a.area ?? Infinity) - (b.area ?? Infinity))
    else if (requestedSort === 'areaDesc') sorted.sort((a, b) => (b.area ?? -Infinity) - (a.area ?? -Infinity))
    propertyItems = sorted.slice(0, requestedLimit)
    if (debug) {
      console.log('[Landing][propertyCarouselSection] selected branch', {
        mappedCount: propertyItems.length,
        sample: propertyItems[0]
          ? {
              slug: propertyItems[0].slug,
              name: propertyItems[0].name,
              price: (propertyItems[0] as any).price,
              currency: (propertyItems[0] as any).currency,
              status: (propertyItems[0] as any).status,
              imagesCount: Array.isArray((propertyItems[0] as any).images) ? (propertyItems[0] as any).images.length : undefined,
            }
          : null,
      })
    }
  } else {
    const scope = resolveLandingListingScope(
      normalizeLandingListingFilter((section as { filters?: unknown }).filters),
      { linkedZone, citySlug },
    )

    if (scope) {
      if (debug) console.log('[Landing][propertyCarouselSection] auto branch: scoped fetch', scope)
      const [result, countrySlug] = await Promise.all([
        fetchCatalogProperties({
          ...scope,
          pageSize: requestedLimit,
          sort: scopedSort,
          page: 1,
        }),
        scope.city ? fetchCityCountrySlugByCitySlug(scope.city) : Promise.resolve(null),
      ])
      const total = result?.totalCount ?? 0
      if (total > 0) {
        seeAll = {
          href: landingScopeCatalogHref(locale, scope, { countrySlug, sort: scopedSort }),
          count: total,
        }
      }
      const items = result?.items ?? []
      propertyItems = items.map((p) => mapCatalogPropertyToCard(p as CatalogProperty, locale)).slice(0, requestedLimit)
      if (debug) {
        console.log('[Landing][propertyCarouselSection] city-scoped results', {
          count: propertyItems.length,
          sample: propertyItems[0] ? { slug: propertyItems[0].slug, name: (propertyItems[0] as any).name } : null,
        })
      }
    } else {
      if (debug) console.log('[Landing][propertyCarouselSection] auto branch: fetching top offers (global)')
      const initialGroup = sortAsGroup ?? 'popular'
      const secondaryLimit = Math.min(12, requestedLimit)
      const [popular, newest, highDemand] = await Promise.all([
        fetchHomeTopOffers('popular', initialGroup === 'popular' ? requestedLimit : secondaryLimit, requestedSort),
        fetchHomeTopOffers('new', initialGroup === 'new' ? requestedLimit : secondaryLimit, requestedSort),
        fetchHomeTopOffers('highDemand', initialGroup === 'highDemand' ? requestedLimit : secondaryLimit, requestedSort),
      ])
      if (debug) {
        console.log('[Landing][propertyCarouselSection] auto fetch results', {
          popularCount: Array.isArray(popular) ? popular.length : popular === null ? null : 'non-array',
          newCount: Array.isArray(newest) ? newest.length : newest === null ? null : 'non-array',
          highDemandCount: Array.isArray(highDemand) ? highDemand.length : highDemand === null ? null : 'non-array',
        })
      }
      topOffersGroups = {
        popular: (popular ?? []).map((p) => mapCatalogPropertyToCard(p as CatalogProperty, locale)).slice(0, requestedLimit),
        new: (newest ?? []).map((p) => mapCatalogPropertyToCard(p as CatalogProperty, locale)).slice(0, requestedLimit),
        highDemand: (highDemand ?? []).map((p) => mapCatalogPropertyToCard(p as CatalogProperty, locale)).slice(0, requestedLimit),
      }
      propertyItems = topOffersGroups.popular
      if (debug) {
        console.log('[Landing][propertyCarouselSection] auto mapped groups', {
          popular: topOffersGroups.popular.length,
          new: topOffersGroups.new.length,
          highDemand: topOffersGroups.highDemand.length,
          propertyItemsCount: propertyItems.length,
          sample: propertyItems[0]
            ? {
                slug: propertyItems[0].slug,
                name: propertyItems[0].name,
                price: (propertyItems[0] as any).price,
                currency: (propertyItems[0] as any).currency,
                status: (propertyItems[0] as any).status,
                imagesCount: Array.isArray((propertyItems[0] as any).images) ? (propertyItems[0] as any).images.length : undefined,
              }
            : null,
        })
      }
    }
  }

  if (topOffersGroups) {
    const [popular, newGroup, highDemand] = await Promise.all([
      attachMarketPositionToCards(topOffersGroups.popular),
      attachMarketPositionToCards(topOffersGroups.new),
      attachMarketPositionToCards(topOffersGroups.highDemand),
    ])
    topOffersGroups = { popular, new: newGroup, highDemand }
    propertyItems = topOffersGroups.popular
  } else if (propertyItems) {
    propertyItems = await attachMarketPositionToCards(propertyItems)
  }

  if (debug) {
    console.log('[Landing][propertyCarouselSection] props to PropertyCarouselSection', {
      badge: propertiesData.badge ?? null,
      title: propertiesData.title ?? null,
      description: propertiesData.description ?? null,
      propertyItemsCount: Array.isArray(propertyItems) ? propertyItems.length : null,
      hasTopOffersGroups: !!topOffersGroups,
    })
  }

  // The label may carry `{count}`; without one the dictionary's "See all N".
  const seeAllLabel = seeAll
    ? (resolveLocalizedString((section as { seeAllLabel?: unknown }).seeAllLabel as never, locale) || '')
        .trim()
        .replace(/\{count\}/g, String(seeAll.count)) || undefined
    : undefined

  return (
    <PropertyCarouselSection
      key={section._key ?? 'properties'}
      locale={locale}
      propertiesData={propertiesData}
      propertyItems={propertyItems}
      topOffersGroups={topOffersGroups}
      initialGroup={sortAsGroup}
      seeAll={seeAll ? { ...seeAll, label: seeAllLabel } : undefined}
      // A filtered or hand-picked feed is a list of these properties; the
      // global top offers on the home page are not one list.
      itemListJsonLd={!topOffersGroups}
    />
  )
}

