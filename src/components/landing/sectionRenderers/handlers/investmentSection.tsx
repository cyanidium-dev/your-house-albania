import * as React from 'react'
import { InvestmentSection } from '@/components/landing/sections'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

export const investmentSectionHandler: SectionHandler = ({ locale, section }) => {
  const benefitsResolved = Array.isArray(section.benefits)
    ? section.benefits.map((b) => resolveLocalizedString(b as never, locale)).filter(Boolean)
    : []
  const statsResolved = Array.isArray((section as { stats?: unknown[] } | null)?.stats)
    ? ((section as { stats?: unknown[] }).stats ?? [])
        .map((row) => {
          const r = row as { label?: unknown; value?: unknown }
          const label = resolveLocalizedString(r.label as never, locale)
          const value = resolveLocalizedString(r.value as never, locale)
          if (!label && !value) return null
          return { label: label || '', value: value || '' }
        })
        .filter((x): x is { label: string; value: string } => x !== null)
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
    stats: statsResolved.length > 0 ? statsResolved : undefined,
  }
  return (
    <InvestmentSection
      key={section._key ?? 'investment'}
      locale={locale}
      investmentData={investmentData}
    />
  )
}

