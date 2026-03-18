import * as React from 'react'
import { InvestmentSection } from '@/components/landing/sections'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

export const investmentSectionHandler: SectionHandler = ({ locale, section }) => {
  const benefitsResolved = Array.isArray(section.benefits)
    ? section.benefits.map((b) => resolveLocalizedString(b as never, locale)).filter(Boolean)
    : []
  const investmentData = {
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    description: resolveLocalizedString(section.description as never, locale) || undefined,
    benefits: benefitsResolved.length > 0 ? benefitsResolved : undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
    primaryImageUrl: (section.primaryImage as { asset?: { url?: string } } | undefined)?.asset?.url,
    primaryImageAlt: (section.primaryImage as { alt?: string } | undefined)?.alt,
    secondaryImageUrl: (section.secondaryImage as { asset?: { url?: string } } | undefined)?.asset?.url,
    secondaryImageAlt: (section.secondaryImage as { alt?: string } | undefined)?.alt,
  }
  return (
    <InvestmentSection
      key={section._key ?? 'investment'}
      locale={locale}
      investmentData={investmentData}
    />
  )
}

