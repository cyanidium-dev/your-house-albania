import * as React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { formatBlogDate } from '@/lib/date/formatLocale'
import { resolveLocaleHref } from '@/lib/routes/resolveLocaleHref'
import { brandButtonClass } from '@/components/shared/BrandButton'
import {
  asConfidenceLevel,
  ConfidenceDot,
  type ConfidenceLevel,
} from '@/components/landing/sections/impl/ConfidenceDot'

type PriceTableRow = {
  _key?: string
  label?: unknown
  cells?: unknown[]
  confidence?: string
  href?: string
}

type PriceTableSectionShape = {
  enabled?: boolean
  title?: unknown
  subtitle?: unknown
  columns?: unknown[]
  rows?: PriceTableRow[]
  confidenceEnabled?: boolean
  sourceNote?: unknown
  lastUpdated?: string
  cta?: { href?: string; label?: unknown }
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Renders the row link: internal paths locale-prefixed via project convention, external via <a>. */
function RowLink({
  href,
  locale,
  className,
  children,
}: {
  href: string
  locale: string
  className?: string
  children: React.ReactNode
}) {
  const resolved = resolveLocaleHref(href, locale)
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return (
      <a href={resolved} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link href={resolved} className={className}>
      {children}
    </Link>
  )
}

/**
 * Data table with sources (AEO block): desktop — table, mobile — per-row cards
 * (label + column/value pairs), following the project adaptive pattern.
 * Server component; disabled or empty section renders nothing.
 */
export function PriceTableSection({
  locale,
  section,
}: {
  locale: string
  section: PriceTableSectionShape
}) {
  const t = useTranslations('Landing')
  if (section.enabled === false) return null

  const columns = (Array.isArray(section.columns) ? section.columns : [])
    .map((c) => resolveLocalizedString(c as never, locale) || '')
  const rows = (Array.isArray(section.rows) ? section.rows : []).filter(
    (r) => r && (r.label || (Array.isArray(r.cells) && r.cells.length > 0)),
  )
  if (columns.length === 0 || rows.length === 0) return null

  const title = resolveLocalizedString(section.title as never, locale) || ''
  const subtitle = resolveLocalizedString(section.subtitle as never, locale) || ''
  const sourceNote = resolveLocalizedString(section.sourceNote as never, locale) || ''
  const lastUpdated = parseDate(section.lastUpdated)
  const showConfidence =
    section.confidenceEnabled === true && rows.some((r) => asConfidenceLevel(r.confidence))
  const ctaLabel = resolveLocalizedString(section.cta?.label as never, locale) || ''
  const ctaHref = section.cta?.href?.trim() || ''
  const showCta = Boolean(ctaLabel && ctaHref)

  const confidenceLabel = (level: ConfidenceLevel) =>
    level === 'high'
      ? t('confidenceHigh')
      : level === 'medium'
        ? t('confidenceMedium')
        : t('confidenceLow')

  const resolvedRows = rows.map((r, i) => {
    const label = resolveLocalizedString(r.label as never, locale) || ''
    const cells = (Array.isArray(r.cells) ? r.cells : []).map(
      (c) => resolveLocalizedString(c as never, locale) || '',
    )
    const confidence = asConfidenceLevel(r.confidence)
    const href = typeof r.href === 'string' && r.href.trim() ? r.href.trim() : null
    return { key: r._key ?? String(i), label, cells, confidence, href }
  })

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {(title || subtitle) && (
          <div className="mb-10 max-w-3xl">
            {title ? (
              <h2 className="text-3xl sm:text-4xl lg:text-52 font-medium text-dark dark:text-white leading-[1.15]">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="text-dark/55 dark:text-white/55 text-base sm:text-lg mt-3 whitespace-pre-line leading-relaxed">
                {subtitle}
              </p>
            ) : null}
          </div>
        )}

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-dark/10 dark:border-white/15">
          <table className="w-full border-collapse text-left">
            <thead className="bg-dark/[0.04] dark:bg-white/5">
              <tr>
                <th className="px-4 sm:px-5 py-3.5 text-dark dark:text-white font-semibold text-sm sm:text-base border-b border-dark/10 dark:border-white/15" />
                {columns.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 sm:px-5 py-3.5 text-dark dark:text-white font-semibold text-sm sm:text-base border-b border-dark/10 dark:border-white/15"
                  >
                    {h}
                  </th>
                ))}
                {showConfidence ? (
                  <th
                    className="px-4 sm:px-5 py-3.5 border-b border-dark/10 dark:border-white/15"
                    aria-label={t('confidenceHigh')}
                  />
                ) : null}
              </tr>
            </thead>
            <tbody>
              {resolvedRows.map((row) => (
                <tr
                  key={row.key}
                  className={`relative odd:bg-transparent even:bg-dark/[0.02] dark:even:bg-white/[0.03] ${
                    row.href ? 'hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors' : ''
                  }`}
                >
                  <td className="px-4 sm:px-5 py-3.5 font-medium text-dark dark:text-white text-sm sm:text-base border-t border-dark/5 dark:border-white/10 min-w-[10rem]">
                    {row.href ? (
                      // Stretched link makes the whole row clickable (tr is the positioning context).
                      <RowLink
                        href={row.href}
                        locale={locale}
                        className="hover:text-primary transition-colors after:absolute after:inset-0"
                      >
                        {row.label}
                      </RowLink>
                    ) : (
                      row.label
                    )}
                  </td>
                  {row.cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 sm:px-5 py-3.5 text-dark/85 dark:text-white/85 text-sm sm:text-base border-t border-dark/5 dark:border-white/10"
                    >
                      {cell}
                    </td>
                  ))}
                  {showConfidence ? (
                    <td className="px-4 sm:px-5 py-3.5 border-t border-dark/5 dark:border-white/10">
                      {row.confidence ? (
                        <ConfidenceDot level={row.confidence} label={confidenceLabel(row.confidence)} />
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: one card per row */}
        <div className="md:hidden flex flex-col gap-3">
          {resolvedRows.map((row) => {
            const card = (
              <div className="rounded-2xl border border-dark/10 dark:border-white/15 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-dark dark:text-white">{row.label}</span>
                  {showConfidence && row.confidence ? (
                    <ConfidenceDot level={row.confidence} label={confidenceLabel(row.confidence)} />
                  ) : null}
                </div>
                <dl className="mt-3 flex flex-col gap-1.5">
                  {row.cells.map((cell, ci) => (
                    <div key={ci} className="flex items-baseline justify-between gap-3 text-sm">
                      <dt className="text-dark/55 dark:text-white/55">{columns[ci] ?? ''}</dt>
                      <dd className="text-dark/85 dark:text-white/85 text-right">{cell || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )
            return row.href ? (
              <RowLink key={row.key} href={row.href} locale={locale} className="block">
                {card}
              </RowLink>
            ) : (
              <div key={row.key}>{card}</div>
            )
          })}
        </div>

        {(sourceNote || lastUpdated) ? (
          <p className="mt-4 text-xs text-dark/50 dark:text-white/50">
            {sourceNote}
            {sourceNote && lastUpdated ? ' · ' : ''}
            {lastUpdated ? t('updatedAt', { date: formatBlogDate(lastUpdated, locale) }) : ''}
          </p>
        ) : null}

        {showCta ? (
          <div className="mt-8">
            <RowLink href={ctaHref} locale={locale} className={brandButtonClass('primary')}>
              {ctaLabel}
            </RowLink>
          </div>
        ) : null}
      </div>
    </section>
  )
}
