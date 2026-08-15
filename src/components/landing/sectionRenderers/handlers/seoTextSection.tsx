import * as React from 'react'
import SeoTextSection from '@/components/landing/sections/impl/SeoTextSectionImpl'
import { resolveRichTextDataFromContent } from '../helpers'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

export const seoTextSectionHandler: SectionHandler = ({ locale, section }) => {
  if (section.enabled === false) return null
  const s = section as {
    content?: unknown
    body?: unknown
    title?: unknown
    videoUrl?: unknown
    cta?: { href?: string; label?: unknown }
    category?: unknown
    readingTimeMinutes?: unknown
    author?: {
      name?: unknown
      role?: unknown
      initials?: unknown
      avatarUrl?: unknown
    }
    stats?: unknown
    pullQuote?: { text?: unknown; author?: unknown }
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

  const category = resolveLocalizedString(s.category as never, locale)?.trim() || undefined
  const readingTimeMinutes =
    typeof s.readingTimeMinutes === 'number' && Number.isFinite(s.readingTimeMinutes) && s.readingTimeMinutes > 0
      ? Math.floor(s.readingTimeMinutes)
      : undefined

  const authorRaw = s.author
  const authorName = resolveLocalizedString(authorRaw?.name as never, locale)?.trim() || undefined
  const authorRole = resolveLocalizedString(authorRaw?.role as never, locale)?.trim() || undefined
  const authorInitials = typeof authorRaw?.initials === 'string' ? authorRaw.initials.trim() || undefined : undefined
  const authorAvatarUrl = typeof authorRaw?.avatarUrl === 'string' ? authorRaw.avatarUrl.trim() || undefined : undefined
  const author =
    authorName || authorRole || authorInitials || authorAvatarUrl
      ? {
          ...(authorName ? { name: authorName } : {}),
          ...(authorRole ? { role: authorRole } : {}),
          ...(authorInitials ? { initials: authorInitials } : {}),
          ...(authorAvatarUrl ? { avatarUrl: authorAvatarUrl } : {}),
        }
      : undefined

  const statsRaw = Array.isArray(s.stats) ? s.stats : []
  const stats = statsRaw
    .map((row) => {
      const r = row as { value?: unknown; label?: unknown }
      const value = typeof r.value === 'string' ? r.value.trim() : ''
      const label = resolveLocalizedString(r.label as never, locale)?.trim() || ''
      if (!value || !label) return null
      return { value, label }
    })
    .filter((x): x is { value: string; label: string } => x !== null)
    .slice(0, 3)

  const pullQuoteText = resolveLocalizedString(s.pullQuote?.text as never, locale)?.trim() || undefined
  const pullQuoteAuthor = resolveLocalizedString(s.pullQuote?.author as never, locale)?.trim() || undefined
  const pullQuote = pullQuoteText
    ? { text: pullQuoteText, ...(pullQuoteAuthor ? { author: pullQuoteAuthor } : {}) }
    : undefined

  return (
    <SeoTextSection
      key={section._key ?? 'seoText'}
      locale={locale}
      seoTextData={seoTextData}
      heading={heading}
      videoUrl={videoUrl}
      cta={cta}
      category={category}
      readingTimeMinutes={readingTimeMinutes}
      author={author}
      stats={stats.length > 0 ? stats : undefined}
      pullQuote={pullQuote}
    />
  )
}
