import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { LandingCollectionSection } from '@/components/landing/sections'
import { resolveLandingItemsFromSection } from '@/components/landing/sections/landingFamilySectionHelpers'
import { clampRelatedLimit, resolveRelatedPagesQuery } from '@/lib/landing/relatedPages'
import {
  fetchRelatedComparisonCards,
  fetchRelatedDistrictLandingCards,
  fetchRelatedGuideCards,
  type RelatedLandingCard,
} from '@/lib/sanity/queries/landing'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

const DEFAULT_TITLE_KEY: Record<string, 'districtsOfCity' | 'comparisons' | 'guides' | 'related'> = {
  cityDistricts: 'districtsOfCity',
  zoneComparisons: 'comparisons',
  topicGuides: 'guides',
  manual: 'related',
}

/**
 * Auto-interlinking cards (ТЗ-16): sibling districts, comparisons involving
 * this zone, guides by topic tags, or manual picks. Items resolve from data at
 * render time; the section renders nothing when the context is unresolvable or
 * the result set is empty — never an empty shell.
 */
export const relatedPagesAutoSectionHandler: SectionHandler = async ({
  locale,
  section,
  citySlug,
  linkedZone,
  landingCtx,
}) => {
  if (section.enabled === false) return null

  const query = resolveRelatedPagesQuery(section as never, {
    citySlug,
    linkedZone,
    topicTags: landingCtx?.topicTags,
  })
  if (!query) return null

  const limit = clampRelatedLimit(section.limit)
  const excludeId = landingCtx?.id

  let cards: RelatedLandingCard[]
  if (query.kind === 'manual') {
    // Manual refs are dereferenced into `landings` by the shared GROQ projection.
    cards = resolveLandingItemsFromSection(section as never) as RelatedLandingCard[]
  } else if (query.kind === 'cityDistricts') {
    cards = await fetchRelatedDistrictLandingCards(query.citySlug, excludeId, limit)
  } else if (query.kind === 'zoneComparisons') {
    cards = await fetchRelatedComparisonCards(query.zoneTags, excludeId, limit)
    if (cards.length === 0) {
      // 5 of 15 comparisons feature zones no other comparison shares, so the
      // strict zone match leaves their related block empty — a regression vs
      // the retired curated graph (found in post-rollout verification,
      // 2026-08-26). Fall back to the comparison cluster so every page keeps
      // its interlinking; the default heading stays the generic
      // "Related comparisons".
      cards = await fetchRelatedGuideCards(['theme:comparison'], excludeId, limit)
    }
  } else {
    cards = await fetchRelatedGuideCards(query.tags, excludeId, limit)
  }

  const resolvedCards = cards
    .filter((c) => c && c._id !== excludeId)
    .slice(0, limit)
    // Generated district landings carry no cardImage — fall back to the
    // district's own photo so sibling cards keep their imagery (spec §5.1).
    .map((c) => (c.cardImage?.asset?.url ? c : { ...c, cardImage: c.zoneHeroImage }))
  if (resolvedCards.length === 0) return null

  let title: unknown = section.title
  if (!resolveLocalizedString(title as never, locale)) {
    const t = await getTranslations('Shared.relatedPages')
    // Already locale-resolved — parking it under `en` makes every locale's
    // fallback chain land on it.
    title = { en: t(DEFAULT_TITLE_KEY[query.kind] ?? 'related') }
  }

  return (
    <LandingCollectionSection
      key={section._key ?? 'related-pages'}
      locale={locale}
      section={{
        enabled: true,
        title,
        subtitle: section.subtitle,
        presentation: 'grid',
        landings: resolvedCards,
      }}
    />
  )
}
