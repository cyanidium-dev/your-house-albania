import * as React from 'react'
import { HeroSection } from '@/components/landing/sections'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { heroTabsFromSection } from '../helpers'
import type { SectionHandler } from './types'

export const heroSectionHandler: SectionHandler = ({ locale, section }) => {
  const heroData = {
    shortLine: resolveLocalizedString(section.shortLine as never, locale) || undefined,
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    subtitle: resolveLocalizedString(section.subtitle as never, locale) || undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
    searchTabs: heroTabsFromSection(section, locale),
  }
  return <HeroSection key={section._key ?? 'hero'} locale={locale} heroData={heroData} />
}

