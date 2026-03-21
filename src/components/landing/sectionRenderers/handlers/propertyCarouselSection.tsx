import * as React from 'react'
import type { PropertyHomes } from '@/types/properyHomes'
import { PropertyCarouselSection } from '@/components/landing/sections'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import {
  fetchHomeTopOffers,
  type CatalogProperty,
  type HomeTopOffersSort,
} from '@/lib/sanity/client'
import { mapCatalogPropertyToCard, mapSanityPropertyToCard } from '@/lib/sanity/propertyAdapter'
import type { SectionHandler } from './types'

export const propertyCarouselSectionHandler: SectionHandler = async ({ locale, section }) => {
  const debug = process.env.NODE_ENV === 'development'
  if (debug) {
    const enabled = (section as { enabled?: unknown } | null)?.enabled
    // Note: enabled is not currently used as a guard for this section.
    console.log('[Landing][propertyCarouselSection] start', {
      locale,
      key: section?._key,
      enabled,
      mode: section?.mode ?? 'auto',
      hasSelectedProps: Array.isArray(section?.properties) ? section.properties.length : 0,
    })
  }

  const propertiesData = {
    badge: resolveLocalizedString(section.shortLine as never, locale) || undefined,
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    description: resolveLocalizedString(section.subtitle as never, locale) || undefined,
  }

  const mode = section.mode ?? 'auto'
  const requestedLimitRaw = Number((section as { limit?: unknown } | null)?.limit)
  const requestedLimit =
    Number.isFinite(requestedLimitRaw) && requestedLimitRaw > 0
      ? Math.min(Math.floor(requestedLimitRaw), 48)
      : 24
  const requestedSortRaw = String((section as { sort?: unknown } | null)?.sort ?? 'newest')
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
    if (debug) console.log('[Landing][propertyCarouselSection] auto branch: fetching top offers')
    const [popular, newest, highDemand] = await Promise.all([
      fetchHomeTopOffers('popular', requestedLimit, requestedSort),
      fetchHomeTopOffers('new', requestedLimit, requestedSort),
      fetchHomeTopOffers('highDemand', requestedLimit, requestedSort),
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

