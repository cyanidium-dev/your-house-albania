import * as React from 'react'
import HeroSection from '@/components/landing/sections/impl/HeroSectionImpl'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { urlFor } from '@/lib/sanity/imageUrl'
import { heroTabsFromSection } from '../helpers'
import { fillLiveTokens } from '@/lib/landing/liveTokens'
import type { SectionHandler } from './types'

export const heroSectionHandler: SectionHandler = ({
  locale,
  section,
  breadcrumb,
  citySlug,
  linkedZone,
  propertiesDeal,
  landingCtx,
  liveTokens,
}) => {
  const live = (text: string) => (text ? fillLiveTokens(text, liveTokens) : text)
  const bg = (section as { backgroundImage?: { asset?: { url?: string }; alt?: string } } | null)?.backgroundImage
  const backgroundImageUrl = bg ? urlFor(bg) : undefined
  // Sanity asset URLs carry the original size ("…-800x600.jpg").
  const sizeMatch = /-(\d+)x(\d+)\.[a-z]+(?:\?|$)/i.exec(bg?.asset?.url ?? '')
  const backgroundImageSize = sizeMatch
    ? { width: Number(sizeMatch[1]), height: Number(sizeMatch[2]) }
    : undefined
  const secondary = (section as { secondaryCta?: { href?: string; label?: unknown } }).secondaryCta
  const heroData = {
    shortLine: live(resolveLocalizedString(section.shortLine as never, locale)) || undefined,
    title: live(resolveLocalizedString(section.title as never, locale)) || undefined,
    subtitle: live(resolveLocalizedString(section.subtitle as never, locale)) || undefined,
    ctaLabel: resolveLocalizedString(section.cta?.label as never, locale) || undefined,
    ctaHref: section.cta?.href,
    secondaryCtaLabel: resolveLocalizedString(secondary?.label as never, locale) || undefined,
    secondaryCtaHref: secondary?.href,
    searchTabs: heroTabsFromSection(section, locale),
    // Not on a page about one place: a city or district page already knows
    // where the reader is looking, and its hero offered a search box with
    // "Any location" preselected (/durres/info, 2026-09-28) under a button
    // that already leads to that place's listings.
    searchEnabled:
      (section.search as { enabled?: boolean } | undefined)?.enabled === true &&
      landingCtx?.pageType !== 'city' &&
      landingCtx?.pageType !== 'district' &&
      !linkedZone,
    backgroundImageUrl,
    backgroundImageAlt: bg?.alt,
    backgroundImageSize,
    enabled: (section as { enabled?: boolean }).enabled,
    // The plain-language assistant field belongs on the homepage only: it is
    // the site-wide entry point, not a per-landing search box.
    aiSearchEnabled: landingCtx?.pageType === 'home',
    layout: landingCtx?.pageType === 'home' ? ('home' as const) : ('default' as const),
    // Most landings carry no background in the CMS. Hand the hero everything
    // the page knows about itself so its fallback photograph is of the right
    // place rather than a generic one.
    photoContext: {
      citySlug: linkedZone?.citySlug ?? citySlug ?? null,
      deal: propertiesDeal ?? null,
      slug: landingCtx?.slug ?? landingCtx?.id ?? null,
    },
  }
  return <HeroSection key={section._key ?? 'hero'} locale={locale} heroData={heroData} breadcrumb={breadcrumb} />
}

