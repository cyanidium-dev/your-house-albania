import * as React from 'react'
import { TrackerSection } from '@/components/landing/sections'
import { fetchTrackerById } from '@/lib/sanity/client'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { isIndexingEnabled } from '@/lib/seo/envSeo'
import { resolveFaqDataFromSection } from '../helpers'
import type { SectionHandler } from './types'

export const trackerSectionHandler: SectionHandler = async ({ locale, section, faqJsonLd }) => {
  if (section.enabled === false) return null
  const ref = section.tracker?._ref
  if (!ref) return null
  const tracker = await fetchTrackerById(ref)
  // Missing or unpublished tracker → render nothing (no broken block).
  if (!tracker) return null

  const titleOverride = resolveLocalizedString(section.title as never, locale) || undefined
  const displayMode = section.displayMode === 'compact' ? 'compact' : 'full'

  // Claim the single-FAQPage slot HERE (handler time, sequential loop order) —
  // claiming inside the async component would race with faqSection handlers
  // that emit at handler time regardless of section position.
  const hasFaq =
    displayMode === 'full' &&
    !!resolveFaqDataFromSection({ items: tracker.faq ?? [] }, locale)?.items?.length
  let emitFaqJsonLd = false
  if (hasFaq && faqJsonLd && !faqJsonLd.emitted && isIndexingEnabled()) {
    emitFaqJsonLd = true
    faqJsonLd.emitted = true
  }

  return (
    <TrackerSection
      key={section._key ?? 'tracker'}
      locale={locale}
      tracker={tracker}
      displayMode={displayMode}
      titleOverride={titleOverride}
      emitFaqJsonLd={emitFaqJsonLd}
    />
  )
}
