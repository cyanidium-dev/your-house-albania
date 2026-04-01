import { resolveLocalizedString } from '@/lib/sanity/localized'
import { resolveLocaleHref } from '@/lib/routes/resolveLocaleHref'

/** Shared landing card shape (from Sanity `landingPage` dereference or inline). */
export type LandingCardModel = {
  _id?: string
  pageType?: string
  slug?: string
  title?: { en?: unknown; ru?: unknown; uk?: unknown; sq?: unknown; it?: unknown }
  cardTitle?: { en?: unknown; ru?: unknown; uk?: unknown; sq?: unknown; it?: unknown }
  cardDescription?: { en?: unknown; ru?: unknown; uk?: unknown; sq?: unknown; it?: unknown }
  cardImage?: { asset?: { url?: string }; alt?: string }
  linkedCity?: { slug?: string }
}

/**
 * Canonical `landingCollectionSection` slice (GROQ coalesces manual refs into `landings`).
 */
export type LandingCollectionSectionLike = {
  enabled?: boolean
  title?: unknown
  subtitle?: unknown
  cta?: { href?: string; label?: unknown }
  /** `"grid"` | `"carousel"` */
  presentation?: string
  mode?: string
  landings?: unknown[]
  manualItems?: unknown[]
}

/** @deprecated Use `LandingCollectionSectionLike` */
export type LandingFamilySectionLike = LandingCollectionSectionLike

/**
 * Resolves cards: prefer dereferenced `landings`, then raw `manualItems`.
 */
export function resolveLandingItemsFromSection(section: LandingCollectionSectionLike): unknown[] {
  if (Array.isArray(section.landings) && section.landings.length > 0) return section.landings
  if (Array.isArray(section.manualItems) && section.manualItems.length > 0) return section.manualItems
  return []
}

export function resolveLandingCardTitle(card: LandingCardModel, locale: string): string {
  return (
    resolveLocalizedString(card.cardTitle as never, locale) ||
    resolveLocalizedString(card.title as never, locale) ||
    '—'
  )
}

export function resolveLandingCardDescription(card: LandingCardModel, locale: string): string | null {
  const s = resolveLocalizedString(card.cardDescription as never, locale)
  return s?.trim() ? s : null
}

export function resolveLandingCardImageUrl(card: LandingCardModel): string | null {
  return card.cardImage?.asset?.url ?? null
}

export function resolveLandingHeaderCta(
  section: { cta?: { href?: string; label?: unknown } },
  locale: string,
): { showCta: boolean; ctaLabel: string; ctaHref: string | null } {
  const ctaLabel = resolveLocalizedString(section.cta?.label as never, locale) || ''
  const raw = section.cta?.href
  const hrefStr = raw != null && typeof raw === 'string' ? raw.trim() : ''
  const showCta = Boolean(ctaLabel.trim() && hrefStr)
  const ctaHref = showCta ? resolveLocaleHref(hrefStr, locale) : null
  return { showCta, ctaLabel, ctaHref }
}

/** Shared header CTA button styles for landing collection section. */
export const landingFamilyHeaderCtaClassName =
  'shrink-0 py-4 px-8 bg-primary hover:bg-dark duration-300 rounded-full text-white font-semibold text-sm'

/** Grid vs carousel; invalid / missing → grid. */
export function resolveLandingPresentation(section: LandingCollectionSectionLike): 'grid' | 'carousel' {
  return section.presentation === 'carousel' ? 'carousel' : 'grid'
}
