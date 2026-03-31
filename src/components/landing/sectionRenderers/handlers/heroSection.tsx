import * as React from 'react'
import { HeroSection } from '@/components/landing/sections'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { urlFor } from '@/lib/sanity/imageUrl'
import { heroTabsFromSection } from '../helpers'
import type { SectionHandler } from './types'

export const heroSectionHandler: SectionHandler = ({ locale, section, breadcrumb }) => {
  const bg = (section as { backgroundImage?: { asset?: { url?: string }; alt?: string } } | null)?.backgroundImage
  const backgroundImageUrl = bg ? urlFor(bg) : undefined
  const secondary = (section as { secondaryCta?: { href?: string; label?: unknown } }).secondaryCta
  const heroData = {
    shortLine: resolveLocalizedString(section.shortLine as never, locale) || undefined,
    title: resolveLocalizedString(section.title as never, locale) || undefined,
    subtitle: resolveLocalizedString(section.subtitle as never, locale) || undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
    secondaryCtaLabel: resolveLocalizedString(secondary?.label as never, locale) || undefined,
    secondaryCtaHref: secondary?.href,
    searchTabs: heroTabsFromSection(section, locale),
    searchEnabled: (section.search as { enabled?: boolean } | undefined)?.enabled === true,
    backgroundImageUrl,
    backgroundImageAlt: bg?.alt,
    enabled: (section as { enabled?: boolean }).enabled,
  }
  return <HeroSection key={section._key ?? 'hero'} locale={locale} heroData={heroData} breadcrumb={breadcrumb} />
}

