import * as React from 'react'
import { LocationCarouselSection } from '@/components/landing/sections'
import { normalizeCitiesOrder } from '@/lib/sanity/cityAdapter'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

export const locationCarouselSectionHandler: SectionHandler = ({ locale, section }) => {
  const rawCities = Array.isArray(section.cities) ? section.cities : []
  if (rawCities.length === 0) return null
  const cities = normalizeCitiesOrder(rawCities as never[], locale)
  const citiesData = {
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    subtitle: resolveLocalizedString(section.subtitle as never, locale) || undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
    cities,
  }
  return <LocationCarouselSection key={section._key ?? 'cities'} locale={locale} citiesData={citiesData} />
}

