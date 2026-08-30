import type { MarketPosition } from '@/lib/property/marketPosition'

export type PropertyHomes = {
  // existing fields (backwards compatible)
  name: string
  slug: string
  location: string
  rate: string
  beds: number
  baths: number
  area: number
  images: PropertyImage[]

  // extended semantic fields for richer UI
  price?: number
  currency?: string
  status?: string
  /** CMS promotion flags (Sanity). */
  promoted?: boolean
  promotionType?: 'premium' | 'top' | 'sale'
  featuredOrder?: number
  discountPercent?: number
  investment?: string | boolean
  propertyType?: string
  propertyTypeSlug?: string
  city?: string
  citySlug?: string
  district?: string
  districtSlug?: string
  /** Sanity district document id — the join key for zoneMetrics lookups. */
  districtId?: string
  /** Construction year, used to pick the new-vs-resale price range for market position. */
  yearBuilt?: number
  /** Computed server-side (see lib/property/marketPosition.ts); null when there isn't enough data to compare. */
  marketPosition?: MarketPosition | null
  /** Short teaser/description text for list view. */
  teaser?: string

  /** Optional map coordinates (Sanity `coordinates.lat/lng`). */
  coordinates?: { lat?: number; lng?: number } | null

  /** Optional internal: used to enable full-card link overlay. */
  _href?: string
}

interface PropertyImage {
  src: string;
}
