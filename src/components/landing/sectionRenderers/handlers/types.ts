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
   * True only for the first `faqSection` on the page — a page may contain at
   * most one schema.org FAQPage, so only that section emits FAQ JSON-LD.
   */
  isFirstFaqSection?: boolean
}) => Promise<React.ReactNode | null> | React.ReactNode | null

