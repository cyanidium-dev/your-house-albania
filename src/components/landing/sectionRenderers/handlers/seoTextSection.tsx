import * as React from 'react'
import { SeoTextSection } from '@/components/landing/sections'
import { resolveRichTextDataFromContent } from '../helpers'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

export const seoTextSectionHandler: SectionHandler = ({ locale, section }) => {
  const s = section as {
    content?: unknown
    body?: unknown
    title?: unknown
    videoUrl?: unknown
    cta?: { href?: string; label?: unknown }
  }
  const raw = s.content ?? s.body
  const seoTextData = resolveRichTextDataFromContent(raw, locale)

  const heading = resolveLocalizedString(s.title as never, locale)?.trim() || undefined

  const videoRaw = s.videoUrl
  const videoUrl =
    typeof videoRaw === 'string' && videoRaw.trim() ? videoRaw.trim() : undefined

  const ctaHref = typeof s.cta?.href === 'string' && s.cta.href.trim() ? s.cta.href.trim() : undefined
  const ctaLabel = resolveLocalizedString(s.cta?.label as never, locale)?.trim() || undefined
  const cta =
    ctaHref && ctaLabel
      ? { href: ctaHref, label: ctaLabel }
      : undefined

  return (
    <SeoTextSection
      key={section._key ?? 'seoText'}
      locale={locale}
      seoTextData={seoTextData}
      heading={heading}
      videoUrl={videoUrl}
      cta={cta}
    />
  )
}
