import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { formatBlogDate } from '@/lib/date/formatLocale'
import type { DeveloperDoc } from '@/lib/sanity/client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { asDeveloperTier, TierDot, type DeveloperTier } from './TierDot'
import { SourcesList } from './SourcesList'

/** Review cadence is quarterly; flag entries not reviewed for half a year. */
const STALE_AFTER_DAYS = 180

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export function developerTierLabelKey(tier: DeveloperTier): 'tierGreen' | 'tierYellow' | 'tierRed' {
  return tier === 'green' ? 'tierGreen' : tier === 'yellow' ? 'tierYellow' : 'tierRed'
}

/**
 * One developer card: logo/initials + name + tier + note + review date, with
 * an expandable details block (description, projects, risks, sources).
 * Shared by `developersRatingSection` and `developerCardSection`.
 */
export async function DeveloperCard({
  locale,
  developer,
}: {
  locale: string
  developer: DeveloperDoc
}) {
  const t = await getTranslations('Developers')

  const tier = asDeveloperTier(developer.tier)
  if (!tier || !developer.name) return null

  const tierLabel = t(developerTierLabelKey(tier))
  const tierNote = resolveLocalizedString(developer.tierNote as never, locale)
  const description = resolveLocalizedString(developer.description as never, locale)
  const revenueNote = resolveLocalizedString(developer.revenueNote as never, locale)
  const risks = resolveLocalizedString(developer.risks as never, locale)
  const reviewedDate = parseDate(developer.lastReviewedAt)
  const isStale =
    reviewedDate !== null &&
    Date.now() - reviewedDate.getTime() > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000
  const logoUrl = developer.logo?.asset?.url
  const initials = developer.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const projects = (developer.keyProjects ?? []).filter((p) => p?.name)
  const sources = developer.sources ?? []
  const hasDetails = Boolean(description || revenueNote || projects.length || risks || sources.length)

  return (
    <div className="rounded-2xl border border-dark/10 dark:border-white/15 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-dark/5 dark:bg-white/10 flex items-center justify-center">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={developer.logo?.alt || developer.name}
              fill
              className="object-contain p-1"
              sizes="48px"
              unoptimized={logoUrl.startsWith('http')}
            />
          ) : (
            <span className="text-sm font-semibold text-dark/60 dark:text-white/60">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-lg font-semibold text-dark dark:text-white">{developer.name}</h3>
            <TierDot tier={tier} label={tierLabel} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-dark/50 dark:text-white/50">
            {reviewedDate ? (
              <span>{t('reviewedAt', { date: formatBlogDate(reviewedDate, locale) })}</span>
            ) : null}
            {developer.foundedYear ? <span>{t('founded', { year: developer.foundedYear })}</span> : null}
            {isStale ? (
              <span className="text-amber-700/80 dark:text-amber-400/80">{t('staleNote')}</span>
            ) : null}
          </div>
        </div>
      </div>

      {tierNote ? (
        <p className="mt-3 text-sm leading-relaxed text-dark/75 dark:text-white/75 whitespace-pre-line">
          {tierNote}
        </p>
      ) : null}

      {hasDetails ? (
        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="details">
            <AccordionTrigger className="p-3 text-sm bg-transparent dark:bg-transparent ring-1 ring-dark/10 dark:ring-white/10">
              {t('details')}
            </AccordionTrigger>
            <AccordionContent className="px-0 pt-3">
              <div className="flex flex-col gap-4 text-sm">
                {description ? (
                  <div>
                    <h4 className="font-semibold text-dark dark:text-white mb-1">{t('about')}</h4>
                    <p className="text-dark/70 dark:text-white/70 whitespace-pre-line">{description}</p>
                    {revenueNote ? (
                      <p className="mt-1.5 text-dark/55 dark:text-white/55">{revenueNote}</p>
                    ) : null}
                  </div>
                ) : revenueNote ? (
                  <p className="text-dark/55 dark:text-white/55">{revenueNote}</p>
                ) : null}

                {projects.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-dark dark:text-white mb-1">{t('keyProjects')}</h4>
                    <ul className="flex flex-col gap-1 text-dark/70 dark:text-white/70">
                      {projects.map((p, i) => {
                        const location = resolveLocalizedString(p.location as never, locale)
                        const label = location ? `${p.name} — ${location}` : p.name
                        const url = typeof p.url === 'string' && p.url.trim() ? p.url.trim() : null
                        return (
                          <li key={p._key ?? i}>
                            {url ? (
                              url.startsWith('http') ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="nofollow noopener"
                                  className="hover:text-primary underline decoration-dark/20 dark:decoration-white/20 underline-offset-2 transition-colors"
                                >
                                  {label}
                                </a>
                              ) : (
                                <Link
                                  href={url.startsWith('/') ? `/${locale}${url}` : `/${locale}/${url}`}
                                  className="hover:text-primary underline decoration-dark/20 dark:decoration-white/20 underline-offset-2 transition-colors"
                                >
                                  {label}
                                </Link>
                              )
                            ) : (
                              label
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}

                {risks ? (
                  <div>
                    <h4 className="font-semibold text-dark dark:text-white mb-1">{t('riskNotes')}</h4>
                    <p className="text-dark/70 dark:text-white/70 whitespace-pre-line">{risks}</p>
                  </div>
                ) : null}

                {sources.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-dark dark:text-white mb-1">{t('sourcesTitle')}</h4>
                    <SourcesList items={sources} locale={locale} />
                  </div>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  )
}
