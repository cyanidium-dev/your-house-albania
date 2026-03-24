import * as React from 'react'
import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding'
import type { LandingSectionBase } from './types'
import type { SectionHandler } from './handlers/types'
import { heroSectionHandler } from './handlers/heroSection'
import { propertyCarouselSectionHandler } from './handlers/propertyCarouselSection'
import { locationCarouselSectionHandler } from './handlers/locationCarouselSection'
import { propertyTypesSectionHandler } from './handlers/propertyTypesSection'
import { investmentSectionHandler } from './handlers/investmentSection'
import { aboutSectionHandler } from './handlers/aboutSection'
import { agentsPromoSectionHandler } from './handlers/agentsPromoSection'
import { seoTextSectionHandler } from './handlers/seoTextSection'
import { faqSectionHandler } from './handlers/faqSection'
import { articlesSectionHandler } from './handlers/articlesSection'
import { cityRichDescriptionSectionHandler } from './handlers/cityRichDescriptionSection'
import { districtsComparisonSectionHandler } from './handlers/districtsComparisonSection'
import { linkedGallerySectionHandler } from './handlers/linkedGallerySection'
import { landingGridSectionHandler } from './handlers/landingGridSection'

const registry: Record<string, SectionHandler> = {
  heroSection: heroSectionHandler,
  propertyCarouselSection: propertyCarouselSectionHandler,
  locationCarouselSection: locationCarouselSectionHandler,
  propertyTypesSection: propertyTypesSectionHandler,
  investmentSection: investmentSectionHandler,
  aboutSection: aboutSectionHandler,
  agentsPromoSection: agentsPromoSectionHandler,
  seoTextSection: seoTextSectionHandler,
  faqSection: faqSectionHandler,
  articlesSection: articlesSectionHandler,
  cityRichDescriptionSection: cityRichDescriptionSectionHandler,
  districtsComparisonSection: districtsComparisonSectionHandler,
  linkedGallerySection: linkedGallerySectionHandler,
  landingGridSection: landingGridSectionHandler,
}

export async function renderLandingSection(input: {
  locale: string
  section: LandingSectionBase
  citySlug?: string
  breadcrumb?: React.ReactNode
  propertiesDeal?: PropertiesDealParam
}): Promise<React.ReactNode | null> {
  const type = input.section?._type
  if (!type) return null
  const handler = registry[type]
  if (!handler) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[LandingRegistry] no handler for section type', {
        locale: input.locale,
        type,
        key: (input.section as any)?._key ?? null,
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

