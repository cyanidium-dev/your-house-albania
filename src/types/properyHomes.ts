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
  featured?: boolean
  investment?: string | boolean
  propertyType?: string
  propertyTypeSlug?: string
  city?: string
  citySlug?: string
  district?: string
  districtSlug?: string
  /** Short teaser/description text for list view. */
  teaser?: string

  /** Optional internal: used to enable full-card link overlay. */
  _href?: string
}

interface PropertyImage {
  src: string;
}
