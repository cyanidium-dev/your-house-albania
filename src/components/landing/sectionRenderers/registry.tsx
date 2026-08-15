import * as React from 'react'
import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding'
import type { LandingSectionBase } from './types'
import type { SectionHandler } from './handlers/types'
import { heroSectionHandler } from './handlers/heroSection'
import { propertyCarouselSectionHandler } from './handlers/propertyCarouselSection'
import { locationCarouselSectionHandler } from './handlers/locationCarouselSection'
import { landingCarouselSectionHandler } from './handlers/landingCarouselSection'
import { propertyTypesSectionHandler } from './handlers/propertyTypesSection'
import { seoTextSectionHandler } from './handlers/seoTextSection'
import { faqSectionHandler } from './handlers/faqSection'
import { articlesSectionHandler } from './handlers/articlesSection'
import { districtsComparisonSectionHandler } from './handlers/districtsComparisonSection'
import { linkedGallerySectionHandler } from './handlers/linkedGallerySection'
import { landingCollectionSectionHandler } from './handlers/landingCollectionSection'
import { investorLogosSectionHandler } from './handlers/investorLogosSection'
import { marketingContentSectionHandler } from './handlers/marketingContentSection'
import { ctaSectionHandler } from './handlers/ctaSection'
import { priceTableSectionHandler } from './handlers/priceTableSection'
import { statsBandSectionHandler } from './handlers/statsBandSection'
import { sourcesSectionHandler } from './handlers/sourcesSection'
import { mortgageCalcSectionHandler } from './handlers/mortgageCalcSection'
import { roiCalcSectionHandler } from './handlers/roiCalcSection'
import { purchaseCostCalcSectionHandler } from './handlers/purchaseCostCalcSection'
import { trackerSectionHandler } from './handlers/trackerSection'
import { developersRatingSectionHandler } from './handlers/developersRatingSection'
import { developerCardSectionHandler } from './handlers/developerCardSection'
import { zoneStatsAutoSectionHandler } from './handlers/zoneStatsAutoSection'
import { zonePriceTableAutoSectionHandler } from './handlers/zonePriceTableAutoSection'

const registry: Record<string, SectionHandler> = {
  heroSection: heroSectionHandler,
  propertyCarouselSection: propertyCarouselSectionHandler,
  locationCarouselSection: locationCarouselSectionHandler,
  landingCarouselSection: landingCarouselSectionHandler,
  propertyTypesSection: propertyTypesSectionHandler,
  seoTextSection: seoTextSectionHandler,
  faqSection: faqSectionHandler,
  articlesSection: articlesSectionHandler,
  districtsComparisonSection: districtsComparisonSectionHandler,
  linkedGallerySection: linkedGallerySectionHandler,
  landingCollectionSection: landingCollectionSectionHandler,
  investorLogosSection: investorLogosSectionHandler,
  marketingContentSection: marketingContentSectionHandler,
  ctaSection: ctaSectionHandler,
  priceTableSection: priceTableSectionHandler,
  statsBandSection: statsBandSectionHandler,
  sourcesSection: sourcesSectionHandler,
  mortgageCalcSection: mortgageCalcSectionHandler,
  roiCalcSection: roiCalcSectionHandler,
  purchaseCostCalcSection: purchaseCostCalcSectionHandler,
  trackerSection: trackerSectionHandler,
  developersRatingSection: developersRatingSectionHandler,
  developerCardSection: developerCardSectionHandler,
  zoneStatsAutoSection: zoneStatsAutoSectionHandler,
  zonePriceTableAutoSection: zonePriceTableAutoSectionHandler,
}

export async function renderLandingSection(input: {
  locale: string
  section: LandingSectionBase
  citySlug?: string
  breadcrumb?: React.ReactNode
  propertiesDeal?: PropertiesDealParam
  /** The landing's own zone, read by the zoneMetrics auto blocks (see handler types). */
  linkedZone?: { type: 'district' | 'city'; id: string }
  /** Shared per-render marker for the single-FAQPage-per-page rule (see handler types). */
  faqJsonLd?: { emitted: boolean }
}): Promise<React.ReactNode | null> {
  const type = input.section?._type
  if (!type) return null
  const handler = registry[type]
  if (!handler) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[LandingRegistry] no handler for section type', {
        locale: input.locale,
        type,
        key: (input.section as { _key?: string })?._key ?? null,
      })
    }
    return null
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('[LandingRegistry] render start', {
      locale: input.locale,
      type,
      key: (input.section as any)?._key ?? null,
    })
  }
  try {
    const node = await handler(input)
    if (process.env.NODE_ENV === 'development') {
      console.log('[LandingRegistry] render ok', {
        locale: input.locale,
        type,
        key: (input.section as any)?._key ?? null,
        rendered: !!node,
      })
    }
    return node
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[LandingRegistry] render crash', {
        locale: input.locale,
        type,
        key: (input.section as any)?._key ?? null,
      })
    }
    throw err
  }
}

