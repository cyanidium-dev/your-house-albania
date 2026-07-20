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
  secondaryCta?: { href?: string; label?: unknown }
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
  /** Portable text / body; `seoTextSection` may pair with optional `title`, `videoUrl`, `cta` */
  content?: unknown
  items?: unknown[]
  /** `investorLogosSection`: dereferenced `agent` documents */
  agents?: unknown[]
  posts?: unknown[]
  search?: { tabs?: LandingHeroTab[] }
  enabled?: boolean
  /** `landingCollectionSection`: `grid` | `carousel` */
  presentation?: string
  landings?: unknown[]
  /** `landingCollectionSection`: raw manual refs when not yet coalesced into `landings` */
  manualItems?: unknown[]
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
  /** `marketingContentSection`: media column order on large screens */
  mediaSide?: 'left' | 'right' | string
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
  /** `priceTableSection`: value column headings (row label column is separate) */
  columns?: unknown[]
  /** `priceTableSection`: show per-row confidence column */
  confidenceEnabled?: boolean
  /** `priceTableSection` / `statsBandSection` / `sourcesSection` */
  sourceNote?: unknown
  lastUpdated?: string
  /** `sourcesSection` */
  sources?: unknown[]
  methodologyNote?: unknown
  intro?: unknown
  /** `mortgageCalcSection` */
  defaultRatePct?: number
  minRatePct?: number
  maxRatePct?: number
  maxLtvPct?: number
  defaultTermYears?: number
  maxTermYears?: number
  /** calculator sections: mandatory localized disclaimer */
  disclaimer?: unknown
  /** `roiCalcSection` */
  presets?: unknown[]
  taxRatePct?: number
  /** `trackerSection`: raw ref + display mode */
  tracker?: { _ref?: string } | null
  displayMode?: 'full' | 'compact' | string
  /** `developerCardSection` / `developersRatingSection`: raw refs + tier filter */
  developer?: { _ref?: string } | null
  developers?: Array<{ _ref?: string }>
  showTiers?: unknown[]
}

export type LandingPageDoc = {
  _id?: string
  _type?: 'landingPage' | string
  pageType?: string
  pageSections?: LandingSectionBase[]
  seo?: unknown
}

