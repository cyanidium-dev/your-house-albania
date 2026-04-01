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
    <section className="py-12 md:py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {showHeader ? (
          <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              {title ? (
                <h2 className="lg:text-52 text-40 font-medium dark:text-white">{title}</h2>
              ) : null}
              {subtitle ? (
                <p className="text-dark/50 dark:text-white/50 text-xm mt-2">{subtitle}</p>
              ) : null}
            </div>
            {showCta && ctaHref ? (
              <Link href={ctaHref} className={landingFamilyHeaderCtaClassName}>
                {ctaLabel}
              </Link>
            ) : null}
          </div>
        ) : null}

        {presentation === 'carousel' ? (
          <LandingCollectionCarousel locale={locale} cards={cards} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((c, idx) => (
              <LandingCard key={c._id ?? idx} locale={locale} card={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
