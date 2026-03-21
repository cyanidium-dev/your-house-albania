export type LocalizedString = { en?: string; ru?: string; uk?: string; sq?: string; it?: string }

export type LandingHeroTab = {
  key?: string
  enabled?: boolean
  label?: LocalizedString
}

export type LandingSectionBase = {
  _key?: string
  _type?: string
  title?: unknown
  subtitle?: unknown
  shortLine?: unknown
  cta?: { href?: string; label?: unknown }
  mode?: string
  properties?: unknown[]
  cities?: unknown[]
  districts?: unknown[]
  propertyTypes?: unknown[]
  resolvedManualItems?: unknown[]
  headings?: unknown[]
  rows?: Array<{ cells?: unknown[] }>
  description?: unknown
  benefits?: unknown[]
  primaryImage?: { asset?: { url?: string }; alt?: string }
  secondaryImage?: { asset?: { url?: string }; alt?: string }
  content?: unknown
  items?: unknown[]
  posts?: unknown[]
  search?: { tabs?: LandingHeroTab[] }
  enabled?: boolean
  sourceMode?: 'manual' | 'auto' | string
  landings?: unknown[]
  limit?: number
  sort?: string
  linkTargetType?: 'catalog' | 'landing' | string
  mediaType?: 'image' | 'video' | string
  mediaImage?: { asset?: { url?: string }; alt?: string }
  mediaVideoUrl?: string
  stats?: unknown[]
  imageMode?: 'withImage' | 'withoutImage'
}

export type LandingPageDoc = {
  _id?: string
  _type?: 'landingPage' | string
  pageType?: string
  pageSections?: LandingSectionBase[]
  seo?: unknown
}

