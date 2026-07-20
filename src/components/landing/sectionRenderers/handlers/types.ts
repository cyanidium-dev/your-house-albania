import type * as React from 'react'
import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding'
import type { LandingSectionBase } from '../types'

export type SectionHandler = (input: {
  locale: string
  section: LandingSectionBase
  citySlug?: string
  /** Passed when first section is heroSection for breadcrumb overlay */
  breadcrumb?: React.ReactNode
  /** Catalog `deal` query for property-type card links when rendered on deal-specific landings */
  propertiesDeal?: PropertiesDealParam
  /**
   * Shared per-render marker: a page may contain at most ONE schema.org
   * FAQPage. Sections are rendered sequentially (awaited in order), so the
   * first FAQ-capable section (`faqSection` or `trackerSection` with FAQ)
   * that actually has items sets `emitted = true`; later ones skip JSON-LD.
   */
  faqJsonLd?: { emitted: boolean }
}) => Promise<React.ReactNode | null> | React.ReactNode | null

