import * as React from 'react'
import Link from 'next/link'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import {
  landingFamilyHeaderCtaClassName,
  resolveLandingHeaderCta,
  resolveLandingItemsFromSection,
  resolveLandingPresentation,
  type LandingCardModel,
  type LandingCollectionSectionLike,
} from '@/components/landing/sections/landingFamilySectionHelpers'
import { LandingCard } from '@/components/landing/sections/LandingCard'
import { LandingCollectionCarousel } from '@/components/landing/sections/LandingCollectionCarousel'
import { balancedGridClass, Section, SectionHeading } from '@/components/shared/layout'

/**
 * Canonical landing-family section: `landingCollectionSection` in Sanity.
 * `presentation` selects grid vs carousel; everything else matches the unified schema.
 */
export function LandingCollectionSection({
  locale,
  section,
}: {
  locale: string
  section: LandingCollectionSectionLike
}) {
  if (section.enabled === false) return null

  const cards = resolveLandingItemsFromSection(section) as LandingCardModel[]
  if (!cards.length) return null

  const presentation = resolveLandingPresentation(section)

  const title = resolveLocalizedString(section.title as never, locale) || ''
  const subtitle = resolveLocalizedString(section.subtitle as never, locale) || ''
  const { showCta, ctaLabel, ctaHref } = resolveLandingHeaderCta(section, locale)

  const showHeader = Boolean(title || subtitle || showCta)

  return (
    <Section>
      {showHeader ? (
        <SectionHeading
          title={title || undefined}
          lead={subtitle || undefined}
          trailing={
            showCta && ctaHref ? (
              <Link href={ctaHref} className={landingFamilyHeaderCtaClassName}>
                {ctaLabel}
              </Link>
            ) : undefined
          }
        />
      ) : null}

      {presentation === 'carousel' ? (
        <LandingCollectionCarousel locale={locale} cards={cards} />
      ) : cards.length === 1 ? (
        <LandingCard locale={locale} card={cards[0]} wide />
      ) : (
        <div className={balancedGridClass(cards.length)}>
          {cards.map((c, idx) => (
            <LandingCard key={c._id ?? idx} locale={locale} card={c} compact={cards.length >= 3} />
          ))}
        </div>
      )}
    </Section>
  )
}
