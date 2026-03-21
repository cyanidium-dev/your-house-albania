import * as React from 'react'
import { LocationCarouselSection } from '@/components/landing/sections'
import {
  normalizeCitiesOrder,
  mapResolvedManualItemsToCards,
  type LocationCarouselCard,
} from '@/lib/sanity/cityAdapter'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

export const locationCarouselSectionHandler: SectionHandler = ({ locale, section }) => {
  const linkTargetTypeRaw = section.linkTargetType
  const linkTargetType: 'catalog' | 'landing' | undefined =
    linkTargetTypeRaw === 'catalog' || linkTargetTypeRaw === 'landing'
      ? linkTargetTypeRaw
      : undefined

  let locationCards: LocationCarouselCard[] = []

  const resolvedItems = Array.isArray((section as { resolvedManualItems?: unknown[] }).resolvedManualItems)
    ? (section as { resolvedManualItems: unknown[] }).resolvedManualItems
    : []
  if (resolvedItems.length > 0) {
    locationCards = mapResolvedManualItemsToCards(resolvedItems as never[], locale, linkTargetType)
  } else {
    const rawCities = Array.isArray(section.cities) ? section.cities : []
    if (rawCities.length === 0) return null
    const cities = normalizeCitiesOrder(rawCities as never[], locale)
    const linkLanding = linkTargetType === 'landing'
    locationCards = cities.map((c) => ({
      ...c,
      href: linkLanding
        ? `/${locale}/cities/${c.slug}`
        : `/${locale}/properties?city=${c.slug}`,
    }))
  }

  if (locationCards.length === 0) return null

  const locationData = {
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    subtitle: resolveLocalizedString(section.subtitle as never, locale) || undefined,
    shortLine: resolveLocalizedString(section.shortLine as never, locale) || undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
    locationCards,
  }
  return <LocationCarouselSection key={section._key ?? 'cities'} locale={locale} locationData={locationData} />
}

