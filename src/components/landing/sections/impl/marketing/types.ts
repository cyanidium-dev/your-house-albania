export type MarketingVariant = "split" | "splitDark" | "grouped";

/** Structured highlight row (investment-style stats cards). */
export type MarketingHighlightCard = {
  value: string;
  label: string;
  description?: string;
};

/** Benefit row with optional Phosphor icon key (e.g. "check-circle", "users"). */
export type MarketingBenefitItem = {
  label: string;
  iconKey?: string;
};

export type MarketingContentGroup = {
  groupTitle?: string;
  description?: string;
  /** Per-group mode; default `list` when omitted. */
  groupDisplay?: "list" | "cards";
  bullets?: string[];
  /** Resolved card rows for `groupDisplay === 'cards'`. */
  groupCards?: MarketingHighlightCard[];
};

export type MarketingContentData = {
  variant: MarketingVariant;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  supportingText?: string;
  /** Legacy plain text bullets — only used when `benefitItems` is empty. */
  benefits?: string[];
  /** Preferred: bullets with explicit Phosphor icon keys. */
  benefitItems?: MarketingBenefitItem[];
  /** Optional trust line shown under CTAs (split layout). */
  trustStripText?: string;
  /** Default `list` when omitted in CMS. */
  highlightsDisplay?: "list" | "cards";
  highlightCards?: MarketingHighlightCard[];
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  mediaMode?: "none" | "fallback" | "custom";
  /** Large-screen column order when a media column exists (`split` / `grouped`). */
  mediaSide?: "left" | "right";
  /** Split `custom` + grouped `custom` intro: max two URLs used in UI. */
  images?: Array<{ url: string; alt?: string }>;
  promoMediaType?: "image" | "video";
  splitDarkImageUrl?: string;
  splitDarkImageAlt?: string;
  videoUrl?: string;
  /** Grouped variant only: intro media below copy, above `contentGroups`. */
  groupedMediaMode?: "none" | "default" | "custom";
  contentGroups?: MarketingContentGroup[];
};

export const SPLIT_PRIMARY_FALLBACK = "/images/investment/primary-fallback.jpg";
export const SPLIT_SECONDARY_FALLBACK = "/images/investment/secondary-fallback.jpg";
