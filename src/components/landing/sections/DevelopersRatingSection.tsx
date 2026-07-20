import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { DeveloperDoc } from '@/lib/sanity/client'
import { asDeveloperTier, TierDot, type DeveloperTier } from './impl/TierDot'
import { DeveloperCard, developerTierLabelKey } from './impl/DeveloperCard'

const TIER_ORDER: DeveloperTier[] = ['green', 'yellow', 'red']

/**
 * Developer traffic-light rating: tier groups (green first), each ordered by
 * `lastReviewedAt` desc (the query pre-sorts; grouping preserves it).
 * The mandatory disclaimer is always visible under the section header.
 */
export async function DevelopersRatingSection({
  locale,
  section,
  developers,
}: {
  locale: string
  section: { title?: unknown; subtitle?: unknown; disclaimer?: unknown; showTiers?: unknown[] }
  developers: DeveloperDoc[]
}) {
  const t = await getTranslations('Developers')

  const disclaimer = resolveLocalizedString(section.disclaimer as never, locale)
  if (!disclaimer) return null

  const allowedTiers = (Array.isArray(section.showTiers) ? section.showTiers : [])
    .map((x) => asDeveloperTier(x))
    .filter((x): x is DeveloperTier => x !== null)
  const tiersToShow = allowedTiers.length > 0 ? allowedTiers : TIER_ORDER

  const groups = TIER_ORDER.filter((tier) => tiersToShow.includes(tier))
    .map((tier) => ({
      tier,
      items: developers.filter((d) => asDeveloperTier(d.tier) === tier),
    }))
    .filter((g) => g.items.length > 0)

  if (groups.length === 0) return null

  const title = resolveLocalizedString(section.title as never, locale)
  const subtitle = resolveLocalizedString(section.subtitle as never, locale)

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="max-w-3xl">
          {title ? (
            <h2 className="text-3xl sm:text-4xl lg:text-52 font-medium text-dark dark:text-white leading-[1.15]">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mt-3 text-base sm:text-lg text-dark/55 dark:text-white/55 whitespace-pre-line leading-relaxed">
              {subtitle}
            </p>
          ) : null}
          {/* Always visible by design — legal caution, never tucked into a footer. */}
          <p className="mt-4 rounded-xl bg-dark/[0.03] dark:bg-white/[0.05] px-4 py-3 text-sm leading-relaxed text-dark/70 dark:text-white/70 whitespace-pre-line">
            {disclaimer}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-10">
          {groups.map((group) => (
            <div key={group.tier}>
              <div className="mb-4">
                <TierDot
                  tier={group.tier}
                  label={t(developerTierLabelKey(group.tier))}
                  className="text-base font-semibold text-dark dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {group.items.map((d) => (
                  <DeveloperCard key={d._id ?? d.slug} locale={locale} developer={d} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
