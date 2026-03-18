import * as React from 'react'
import { AboutSection } from '@/components/landing/sections'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { SectionHandler } from './types'

export const aboutSectionHandler: SectionHandler = ({ locale, section }) => {
  const benefitsResolved = Array.isArray(section.benefits)
    ? section.benefits.map((b) => resolveLocalizedString(b as never, locale)).filter(Boolean)
    : []
  const aboutData = {
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    description: resolveLocalizedString(section.description as never, locale) || undefined,
    benefits: benefitsResolved.length > 0 ? benefitsResolved : undefined,
  }
  return <AboutSection key={section._key ?? 'about'} locale={locale} aboutData={aboutData} />
}

