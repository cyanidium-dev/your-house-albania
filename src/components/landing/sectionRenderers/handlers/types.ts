import type * as React from 'react'
import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding'
import type { LandingSectionBase } from '../types'

/** The zone a landing is about, resolved once by `LandingRenderer`. */
export type LinkedZone = {
  type: 'district' | 'city'
  id: string
  /** District slug on district landings, city slug on city ones. */
  slug?: string
  /** Always the city slug — a district's parent, or the city itself. */
  citySlug?: string
}

export type SectionHandler = (input: {
  locale: string
  section: LandingSectionBase
  citySlug?: string
  /** Passed when first section is heroSection for breadcrumb overlay */
  breadcrumb?: React.ReactNode
  /** Catalog `deal` query for property-type card links when rendered on deal-specific landings */
  propertiesDeal?: PropertiesDealParam
  /**
   * The landing's own zone: `linkedDistrict` when present, else `linkedCity`.
   * The zoneMetrics auto blocks read the id; the property carousel reads the
   * slugs, so a generated district page filters to its own district without a
   * reference set on every section.
   */
  linkedZone?: LinkedZone
  /**
   * Shared per-render marker: a page may contain at most ONE schema.org
   * FAQPage. Sections are rendered sequentially (awaited in order), so the
   * first FAQ-capable section (`faqSection` or `trackerSection` with FAQ)
   * that actually has items sets `emitted = true`; later ones skip JSON-LD.
   */
  faqJsonLd?: { emitted: boolean }
}) => Promise<React.ReactNode | null> | React.ReactNode | null

