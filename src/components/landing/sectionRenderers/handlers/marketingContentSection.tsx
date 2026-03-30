import * as React from 'react'
import { MarketingContentSection } from '@/components/landing/sections/MarketingContentSection'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'
import type {
  MarketingContentData,
  MarketingHighlightCard,
  MarketingVariant,
} from '@/components/landing/sections/impl/MarketingContentSectionImpl'

const VALID_VARIANTS: MarketingVariant[] = ['split', 'splitDark', 'grouped']

function resolveStringList(raw: unknown, locale: string): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((b) => resolveLocalizedString(b as never, locale)).filter((s) => Boolean(s?.trim()))
}

/** Resolved marketing `images[]` items (url + optional localized alt). */
function resolveMarketingImages(raw: unknown, locale: string): Array<{ url: string; alt?: string }> {
  if (!Array.isArray(raw)) return []
  const out: Array<{ url: string; alt?: string }> = []
  for (const item of raw) {
    const row = item as {
      asset?: { url?: string }
      image?: { asset?: { url?: string }; alt?: unknown }
      alt?: unknown
    }
    const url =
      (typeof row.asset?.url === 'string' && row.asset.url.trim()) ||
      (typeof row.image?.asset?.url === 'string' && row.image.asset.url.trim()) ||
      ''
    if (!url) continue
    const altRaw = row.alt ?? row.image?.alt
    const alt = resolveLocalizedString(altRaw as never, locale) || undefined
    out.push({ url, alt })
  }
  return out
}

function resolveHighlightCards(raw: unknown, locale: string): MarketingHighlightCard[] {
  if (!Array.isArray(raw)) return []
  const out: MarketingHighlightCard[] = []
  for (const row of raw) {
    const r = row as { value?: unknown; label?: unknown; description?: unknown }
    const value = resolveLocalizedString(r.value as never, locale).trim()
    const label = resolveLocalizedString(r.label as never, locale).trim()
    const descriptionRaw = resolveLocalizedString(r.description as never, locale).trim()
    if (!value && !label) continue
    const card: MarketingHighlightCard = { value, label }
    if (descriptionRaw) card.description = descriptionRaw
    out.push(card)
  }
  return out
}

function normalizeVariant(raw: unknown): MarketingVariant {
  const s = typeof raw === 'string' ? raw : ''
  return VALID_VARIANTS.includes(s as MarketingVariant) ? (s as MarketingVariant) : 'split'
}

export const marketingContentSectionHandler: SectionHandler = ({ locale, section }) => {
  if (section.enabled === false) return null

  const variant = normalizeVariant((section as { variant?: unknown }).variant)

  const title = resolveLocalizedString(section.title as never, locale) || undefined
  const subtitle = resolveLocalizedString((section as { subtitle?: unknown }).subtitle as never, locale) || undefined
  const description = resolveLocalizedString(section.description as never, locale) || undefined
  const eyebrow = resolveLocalizedString((section as { eyebrow?: unknown }).eyebrow as never, locale) || undefined
  const supportingText = resolveLocalizedString((section as { supportingText?: unknown }).supportingText as never, locale) || undefined
  const benefitsResolved = resolveStringList(section.benefits, locale)

  const highlightsDisplayRaw = (section as { highlightsDisplay?: unknown }).highlightsDisplay
  const highlightsDisplay: 'list' | 'cards' = highlightsDisplayRaw === 'cards' ? 'cards' : 'list'
  const highlightCardsResolved = resolveHighlightCards(
    (section as { highlightsCards?: unknown }).highlightsCards,
    locale,
  )

  const mediaModeRaw = (section as { mediaMode?: unknown }).mediaMode
  const mediaMode: 'none' | 'fallback' | 'custom' | undefined =
    mediaModeRaw === 'none' || mediaModeRaw === 'fallback' || mediaModeRaw === 'custom' ? mediaModeRaw : undefined

  const promoMediaTypeRaw = (section as { promoMediaType?: unknown }).promoMediaType
  const promoMediaType: 'image' | 'video' | undefined =
    promoMediaTypeRaw === 'image' || promoMediaTypeRaw === 'video' ? promoMediaTypeRaw : undefined

  const rawGroups = Array.isArray((section as { contentGroups?: unknown[] }).contentGroups)
    ? (section as { contentGroups: unknown[] }).contentGroups
    : []
  const contentGroups: MarketingContentData['contentGroups'] = rawGroups
    .map((g) => {
      const row = g as {
        groupTitle?: unknown
        description?: unknown
        bullets?: unknown[]
        groupDisplay?: unknown
        cards?: unknown
      }
      const groupTitle = resolveLocalizedString(row.groupTitle as never, locale) || undefined
      const groupDescription = resolveLocalizedString(row.description as never, locale) || undefined
      const bullets = resolveStringList(row.bullets, locale)
      const groupDisplay: 'list' | 'cards' = row.groupDisplay === 'cards' ? 'cards' : 'list'
      const groupCards = resolveHighlightCards(row.cards, locale)
      return {
        groupTitle,
        description: groupDescription,
        groupDisplay,
        bullets,
        groupCards: groupCards.length > 0 ? groupCards : undefined,
      }
    })
    .filter((g) => {
      const hasTitle = Boolean(g.groupTitle?.trim())
      const hasDesc = Boolean(g.description?.trim())
      const hasBullets = (g.bullets?.length ?? 0) > 0
      const hasGroupCards = (g.groupCards?.length ?? 0) > 0
      return hasTitle || hasDesc || hasBullets || hasGroupCards
    })

  const legacyImage = (section as { image?: { asset?: { url?: string }; alt?: string } }).image
  const imagesResolved = resolveMarketingImages((section as { images?: unknown }).images, locale).slice(0, 2)

  const videoUrlRaw = (section as { videoUrl?: unknown }).videoUrl
  const mediaVideoUrlRaw = (section as { mediaVideoUrl?: unknown }).mediaVideoUrl
  const videoUrl =
    typeof videoUrlRaw === 'string' && videoUrlRaw.trim()
      ? videoUrlRaw
      : typeof mediaVideoUrlRaw === 'string' && mediaVideoUrlRaw.trim()
        ? mediaVideoUrlRaw
        : (section as { mediaVideo?: { asset?: { url?: string } } }).mediaVideo?.asset?.url

  const groupedMediaRaw = (section as { groupedMediaMode?: unknown }).groupedMediaMode
  const groupedMediaMode: 'none' | 'default' | 'custom' =
    groupedMediaRaw === 'default' || groupedMediaRaw === 'custom' || groupedMediaRaw === 'none'
      ? groupedMediaRaw
      : 'none'
  const data: MarketingContentData = {
    variant,
    eyebrow,
    title,
    subtitle,
    description,
    supportingText,
    benefits: benefitsResolved.length > 0 ? benefitsResolved : undefined,
    highlightsDisplay,
    highlightCards: highlightCardsResolved.length > 0 ? highlightCardsResolved : undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
    mediaMode,
    images: imagesResolved.length > 0 ? imagesResolved : undefined,
    promoMediaType,
    splitDarkImageUrl: legacyImage?.asset?.url,
    splitDarkImageAlt: legacyImage?.alt,
    videoUrl,
    groupedMediaMode,
    contentGroups: contentGroups.length > 0 ? contentGroups : undefined,
  }

  const hasCore = Boolean(
    title?.trim() || description?.trim() || eyebrow?.trim() || subtitle?.trim(),
  )
  const hasListHighlights = (data.benefits?.length ?? 0) > 0
  const hasCardHighlights = (data.highlightCards?.length ?? 0) > 0
  const hasAnyHighlight = hasListHighlights || hasCardHighlights
  const hasCta = Boolean(data.ctaLabel && data.ctaHref)
  const hasGroups = variant === 'grouped' && (data.contentGroups?.length ?? 0) > 0

  if (variant === 'grouped') {
    if (!hasCore && !hasGroups) return null
  } else if (!hasCore && !hasAnyHighlight && !hasCta) {
    return null
  }

  return (
    <MarketingContentSection key={section._key ?? 'marketingContent'} locale={locale} data={data} />
  )
}
