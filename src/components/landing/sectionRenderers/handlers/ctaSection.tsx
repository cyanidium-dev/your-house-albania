import * as React from 'react'
import { CtaSection } from '@/components/landing/sections/CtaSection'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

export const ctaSectionHandler: SectionHandler = ({ locale, section }) => {
  if (section.enabled === false) return null

  const sec = section as {
    eyebrow?: unknown
    title?: unknown
    description?: unknown
    cta?: { href?: string; label?: unknown }
    secondaryCta?: { href?: string; label?: unknown }
  }

  const eyebrow = resolveLocalizedString(sec.eyebrow as never, locale) || undefined
  const title = resolveLocalizedString(sec.title as never, locale) || undefined
  const description = resolveLocalizedString(sec.description as never, locale) || undefined
  const primaryLabel = resolveLocalizedString(sec.cta?.label as never, locale) || ''
  const primaryHref = sec.cta?.href
  const secondaryLabel = resolveLocalizedString(sec.secondaryCta?.label as never, locale) || ''
  const secondaryHref = sec.secondaryCta?.href

  const showPrimary = Boolean(primaryLabel.trim() && primaryHref)
  const showSecondary = Boolean(secondaryLabel.trim() && secondaryHref)
  const hasCopy = Boolean(eyebrow || title?.trim() || description?.trim())

  if (!hasCopy && !showPrimary && !showSecondary) return null

  return (
    <CtaSection
      key={section._key ?? 'cta'}
      locale={locale}
      eyebrow={eyebrow}
      title={title}
      description={description}
      primaryLabel={showPrimary ? primaryLabel : undefined}
      primaryHref={showPrimary ? primaryHref : undefined}
      secondaryLabel={showSecondary ? secondaryLabel : undefined}
      secondaryHref={showSecondary ? secondaryHref : undefined}
    />
  )
}
