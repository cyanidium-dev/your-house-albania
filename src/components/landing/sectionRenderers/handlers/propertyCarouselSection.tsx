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
import type { SectionHandler } from './types'
import type { ConstructionStageFilter } from '@/types/catalog'

type CarouselScope = {
  city?: string
  district?: string
  type?: string
  deal?: string
  stage?: ConstructionStageFilter
  investment?: boolean
}

/**
 * Catalog scope for auto mode, most specific first: filters set on the section
 * win, otherwise the carousel follows the page — and on a district landing that
 * means the district, not its whole city. Without this a district page shows
 * other districts' properties, which is worse than showing none.
 */
function resolveScope(
  filters: { city?: string; district?: string; propertyType?: string; deal?: string; stage?: ConstructionStageFilter; investment?: boolean } | undefined,
  linkedZone: { type: 'district' | 'city'; slug?: string; citySlug?: string } | undefined,
  citySlug: string | undefined,
): CarouselScope | null {
  const f = filters ?? {}
  const base: CarouselScope = {}
  if (f.propertyType) base.type = f.propertyType
  if (f.deal) base.deal = f.deal
  // A stage or investment filter is what turns this carousel into a new-builds
  // block, so it counts as scope on its own — without it the section would
  // fall through to the unfiltered top-offers branch and show finished flats.
  if (f.stage) base.stage = f.stage
  if (f.investment) base.investment = true

  if (f.district) return { ...base, district: f.district, city: f.city }
  if (f.city) return { ...base, city: f.city }
  if (base.type || base.deal || base.stage || base.investment) {
    // A type/deal filter with no place still scopes to the page's own place.
    const city = linkedZone?.citySlug ?? citySlug
    if (linkedZone?.type === 'district' && linkedZone.slug) {
      return { ...base, district: linkedZone.slug, city }
    }
    return city ? { ...base, city } : base
  }

  if (linkedZone?.type === 'district' && linkedZone.slug) {
    return { district: linkedZone.slug, city: linkedZone.citySlug ?? citySlug }
  }
  const city = linkedZone?.citySlug ?? citySlug
  return city ? { city } : null
}

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
    const scope = resolveScope(
      (section as { filters?: { city?: string; district?: string; propertyType?: string; deal?: string; stage?: ConstructionStageFilter; investment?: boolean } })
        .filters,
      linkedZone,
      citySlug,
    )

    if (scope) {
      if (debug) console.log('[Landing][propertyCarouselSection] auto branch: scoped fetch', scope)
      const catalogSort =
        requestedSort === 'priceAsc' || requestedSort === 'priceDesc' ||
        requestedSort === 'areaAsc' || requestedSort === 'areaDesc'
          ? requestedSort
          : 'newest'
      const result = await fetchCatalogProperties({
        ...scope,
        pageSize: requestedLimit,
        sort: catalogSort,
        page: 1,
      })
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

  return (
    <PropertyCarouselSection
      key={section._key ?? 'properties'}
      locale={locale}
      propertiesData={propertiesData}
      propertyItems={propertyItems}
      topOffersGroups={topOffersGroups}
      initialGroup={sortAsGroup}
    />
  )
}

