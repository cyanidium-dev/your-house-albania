import * as React from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import {
  asDeveloperTier,
  TierDot,
} from '@/components/landing/sections/impl/TierDot'
import { developerTierLabelKey } from '@/components/landing/sections/impl/DeveloperCard'

export type PropertyDeveloperRef = {
  name?: string
  tier?: string
  tierNote?: unknown
  linkedGuide?: { slug?: string; enabled?: boolean; pageType?: string } | null
} | null

/**
 * Compact developer badge for the property detail key-info block:
 * "Developer: {name}" + tier dot with the tier note as a tooltip.
 * Links to the developer guide when one exists and is enabled.
 * Renders nothing without a valid ref.
 */
export async function PropertyDeveloperBadge({
  locale,
  developer,
}: {
  locale: string
  developer: PropertyDeveloperRef
}) {
  const tier = asDeveloperTier(developer?.tier)
  const name = developer?.name?.trim()
  if (!developer || !tier || !name) return null

  const t = await getTranslations('Developers')
  const tierNote = resolveLocalizedString(developer.tierNote as never, locale)
  const guide = developer.linkedGuide
  const guideHref =
    guide?.slug && guide.enabled !== false && guide.pageType === 'custom'
      ? `/${locale}/guides/${encodeURIComponent(guide.slug)}`
      : null

  const badge = (
    <span
      title={tierNote || t(developerTierLabelKey(tier))}
      className="inline-flex items-center gap-2 text-sm text-dark/70 dark:text-white/70"
    >
      <span className="font-medium">
        {t('developerLabel')}: <span className="text-dark dark:text-white">{name}</span>
      </span>
      <TierDot tier={tier} label={t(developerTierLabelKey(tier))} showLabel={false} />
    </span>
  )

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      {guideHref ? (
        <Link href={guideHref} className="hover:text-primary transition-colors">
          {badge}
        </Link>
      ) : (
        badge
      )}
      {/* Standard one-line legal caution — same dictionary key as the developer blocks. */}
      <span className="text-xs text-dark/40 dark:text-white/40">{t('disclaimerShort')}</span>
    </div>
  )
}
