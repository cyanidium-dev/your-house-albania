import * as React from 'react'
import { AgentsPromoSection } from '@/components/landing/sections'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

export const agentsPromoSectionHandler: SectionHandler = ({ locale, section }) => {
  const benefitsResolved = Array.isArray(section.benefits)
    ? section.benefits.map((b) => resolveLocalizedString(b as never, locale)).filter(Boolean).slice(0, 3)
    : []
  const agentsPromoData = {
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    subtitle: resolveLocalizedString(section.subtitle as never, locale) || undefined,
    description: resolveLocalizedString(section.description as never, locale) || undefined,
    benefits: benefitsResolved.length > 0 ? benefitsResolved : undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
  }
  return <AgentsPromoSection key={section._key ?? 'agentsPromo'} agentsPromoData={agentsPromoData} />
}

