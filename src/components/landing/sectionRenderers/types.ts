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
  /** `investorLogosSection`: dereferenced `agent` documents */
  agents?: unknown[]
  posts?: unknown[]
  search?: { tabs?: LandingHeroTab[] }
  enabled?: boolean
  sourceMode?: 'manual' | 'auto' | string
  landings?: unknown[]
  limit?: number
  sort?: string
  linkTargetType?: 'catalog' | 'landing' | string
  /** `marketingContentSection` splitDark: legacy image field */
  image?: { asset?: { url?: string }; alt?: string }
  mediaVideoUrl?: string
  /** Alternate CMS field name for external video URL */
  videoUrl?: string
  mediaVideo?: { asset?: { url?: string } }
  imageMode?: 'withImage' | 'withoutImage'
  /** `marketingContentSection` */
  variant?: 'split' | 'splitDark' | 'grouped' | string
  eyebrow?: unknown
  supportingText?: unknown
  mediaMode?: 'none' | 'fallback' | 'custom' | string
  promoMediaType?: 'image' | 'video' | string
  contentGroups?: unknown[]
  /** `marketingContentSection` */
  highlightsDisplay?: 'list' | 'cards' | string
  highlightsCards?: unknown[]
  /** `marketingContentSection` grouped variant */
  groupedMediaMode?: 'none' | 'default' | 'custom' | string
  groupedImage?: { asset?: { url?: string }; alt?: string }
  /** `marketingContentSection` split + grouped custom media */
  images?: unknown[]
}

export type LandingPageDoc = {
  _id?: string
  _type?: 'landingPage' | string
  pageType?: string
  pageSections?: LandingSectionBase[]
  seo?: unknown
}

