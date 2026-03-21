import * as React from 'react'
import { HeroSection } from '@/components/landing/sections'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { heroTabsFromSection } from '../helpers'
import type { SectionHandler } from './types'

export const heroSectionHandler: SectionHandler = ({ locale, section }) => {
  const bg = (section as { backgroundImage?: { asset?: { url?: string }; alt?: string } } | null)?.backgroundImage
  const heroData = {
    shortLine: resolveLocalizedString(section.shortLine as never, locale) || undefined,
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    subtitle: resolveLocalizedString(section.subtitle as never, locale) || undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
    searchTabs: heroTabsFromSection(section, locale),
    searchEnabled: (section.search as { enabled?: boolean } | undefined)?.enabled === true,
    backgroundImageUrl: bg?.asset?.url,
    backgroundImageAlt: bg?.alt,
  }
  return <HeroSection key={section._key ?? 'hero'} locale={locale} heroData={heroData} />
}

