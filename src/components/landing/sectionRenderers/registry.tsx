import * as React from 'react'
import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding'
import type { LandingSectionBase } from './types'
import type { SectionHandler, LinkedZone } from './handlers/types'
import { heroSectionHandler } from './handlers/heroSection'
import { propertyCarouselSectionHandler } from './handlers/propertyCarouselSection'
import { locationCarouselSectionHandler } from './handlers/locationCarouselSection'
import { propertyTypesSectionHandler } from './handlers/propertyTypesSection'
import { seoTextSectionHandler } from './handlers/seoTextSection'
import { faqSectionHandler } from './handlers/faqSection'
import { articlesSectionHandler } from './handlers/articlesSection'
import { districtsComparisonSectionHandler } from './handlers/districtsComparisonSection'
import { linkedGallerySectionHandler } from './handlers/linkedGallerySection'
import { landingCollectionSectionHandler } from './handlers/landingCollectionSection'
// Investor logos: off site-wide until there are real logos to show (2026-09).
// import { investorLogosSectionHandler } from './handlers/investorLogosSection'
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
import { relatedPagesAutoSectionHandler } from './handlers/relatedPagesAutoSection'

const registry: Record<string, SectionHandler> = {
  heroSection: heroSectionHandler,
  propertyCarouselSection: propertyCarouselSectionHandler,
  locationCarouselSection: locationCarouselSectionHandler,
  propertyTypesSection: propertyTypesSectionHandler,
  seoTextSection: seoTextSectionHandler,
  faqSection: faqSectionHandler,
  articlesSection: articlesSectionHandler,
  districtsComparisonSection: districtsComparisonSectionHandler,
  linkedGallerySection: linkedGallerySectionHandler,
  landingCollectionSection: landingCollectionSectionHandler,
  // No handler means the section renders nothing wherever the CMS still lists
  // it — the agent documents carry no logo artwork, so the tiles fell back to
  // generic house glyphs and read as filler. Restore this line (and the import)
  // once real logos exist; the section itself is untouched and still honours
  // its own `enabled` flag.
  // investorLogosSection: investorLogosSectionHandler,
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
  relatedPagesAutoSection: relatedPagesAutoSectionHandler,
}

export async function renderLandingSection(input: {
  locale: string
  section: LandingSectionBase
  citySlug?: string
  breadcrumb?: React.ReactNode
  propertiesDeal?: PropertiesDealParam
  /** The landing's own zone, read by the zoneMetrics blocks and the carousel (see handler types). */
  linkedZone?: LinkedZone
  /** Shared per-render marker for the single-FAQPage-per-page rule (see handler types). */
  faqJsonLd?: { emitted: boolean }
  /** Host landing context for the related-pages auto modes (see handler types). */
  landingCtx?: { id?: string; slug?: string; pageType?: string; topicTags?: string[] }
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

