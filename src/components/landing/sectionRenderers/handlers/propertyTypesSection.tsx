import * as React from 'react'
import { PropertyTypesSection } from '@/components/landing/sections'
import { fetchActivePropertyTypes } from '@/lib/sanity/client'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { mapSanityPropertyTypeToCard } from '@/lib/sanity/propertyTypeAdapter'
import type { SectionHandler } from './types'

export const propertyTypesSectionHandler: SectionHandler = async ({
  locale,
  section,
  propertiesDeal,
}) => {
  let rawTypes = Array.isArray(section.propertyTypes) ? section.propertyTypes : []
  if (rawTypes.length === 0) {
    const enriched = await fetchActivePropertyTypes(8)
    rawTypes = Array.isArray(enriched) ? enriched : []
  }
  if (rawTypes.length === 0) return null
  const types = (rawTypes as never[]).map((p) => mapSanityPropertyTypeToCard(p, locale))
  const propertyTypesData = {
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    subtitle: resolveLocalizedString(section.subtitle as never, locale) || undefined,
    shortLine: resolveLocalizedString(section.shortLine as never, locale) || undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
    propertyTypes: types,
  }
  return (
    <PropertyTypesSection
      key={section._key ?? 'propertyTypes'}
      locale={locale}
      propertyTypesData={propertyTypesData}
      propertiesDeal={propertiesDeal}
    />
  )
}

