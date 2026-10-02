import * as React from 'react'
import Link from "@/components/shared/Link";
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
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/currency/format'
import { parseNumericRange, rangePosition, rangeScale, type RangeScale } from '@/lib/format/numericRange'
import { MEASURE, Section, SectionHeading, SPLIT, SPLIT_ASIDE, SPLIT_MAIN } from '@/components/shared/layout'

type PriceTableRow = {
  _key?: string
  /** The row for the page's own place: bold, and a full-strength bar among muted ones. */
  current?: boolean
  label?: unknown
  cells?: unknown[]
  confidence?: string
  href?: string
}

type PriceTableSectionShape = {
  enabled?: boolean
  title?: unknown
  subtitle?: unknown
  /**
   * Header for the row-label column. `columns` describes only the value
   * columns, so without this the label column is headerless — fine for a
   * manual table whose labels are self-evident, wrong for the generated zone
   * table, where the column means "zone".
   */
  labelHeader?: unknown
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

function RangeBar({
  range,
  scale,
  muted = false,
}: {
  range: [number, number] | null
  scale: RangeScale
  muted?: boolean
}) {
  if (!range) return <div className="h-2 rounded-full bg-dark/[0.05] dark:bg-white/[0.06]" aria-hidden />
  const { left, width } = rangePosition(range, scale)
  return (
    <div className="relative h-2 rounded-full bg-dark/[0.06] dark:bg-white/[0.08]" aria-hidden>
      <div
        className={`absolute inset-y-0 rounded-full ${muted ? 'bg-primary/45' : 'bg-primary'}`}
        // A single figure is a point, drawn as a dot rather than a zero-width bar.
        style={{
          left: `${left}%`,
          width: width > 0 ? `max(${width}%, 0.5rem)` : '0.5rem',
          marginLeft: width > 0 ? 0 : '-0.25rem',
        }}
      />
    </div>
  )
}

/**
 * Data table with sources (AEO block): desktop — table, mobile — per-row cards
 * (label + column/value pairs), following the project adaptive pattern.
 *
 * A zone table usually has one or two value columns ("All stock, €/m²"), and
 * stretched across 1400px it read as a label, a number and a lot of nothing.
 * When a value column holds prices, each row gets a bar on one shared scale in
 * the space that was empty, so the table shows where every zone sits against
 * the others instead of asking the reader to compare ten ranges in their
 * head. A table with more columns fills the row by itself and draws no bars.
 *
 * `aside` (the sources) sits beside a narrow table without bars, and under the
 * table otherwise. Server component; disabled or empty section renders nothing.
 */
export function PriceTableSection({
  locale,
  section,
  aside,
}: {
  locale: string
  section: PriceTableSectionShape
  aside?: React.ReactNode
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
  const labelHeader = resolveLocalizedString(section.labelHeader as never, locale) || ''
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
    return { key: r._key ?? String(i), label, cells, confidence, href, current: r.current === true }
  })

  // Bars for the first value column that reads as prices in most rows.
  let scale: RangeScale | null = null
  let ranges: Array<[number, number] | null> = []
  if (columns.length <= 2) {
    for (let ci = 0; ci < columns.length && !scale; ci++) {
      const parsed = resolvedRows.map((r) => parseNumericRange(r.cells[ci]))
      const hits = parsed.filter(Boolean).length
      const s = hits >= Math.ceil(resolvedRows.length * 0.6) ? rangeScale(parsed) : null
      if (s) {
        scale = s
        ranges = parsed
      }
    }
  }
  const showBars = scale !== null
  const hasCurrent = resolvedRows.some((r) => r.current)
  const asideBeside = Boolean(aside) && !showBars && columns.length <= 2

  const levelsShown = showConfidence
    ? (['high', 'medium', 'low'] as const).filter((l) => resolvedRows.some((r) => r.confidence === l))
    : []

  const cellPad = 'px-4 sm:px-5 py-3.5'
  const headCell = `${cellPad} text-dark dark:text-white font-semibold text-sm sm:text-base border-b border-dark/10 dark:border-white/15`
  const bodyCell = `${cellPad} border-t border-dark/5 dark:border-white/10`

  const table = (
    <>
      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-dark/10 dark:border-white/15">
        <table className="w-full border-collapse text-left">
          <thead className="bg-dark/[0.04] dark:bg-white/5">
            <tr>
              <th className={headCell}>{labelHeader}</th>
              {columns.map((h, i) => (
                <th key={i} className={`${headCell} whitespace-nowrap`}>
                  {h}
                </th>
              ))}
              {showBars ? (
                <th className={`${cellPad} w-[42%] border-b border-dark/10 dark:border-white/15 align-bottom`}>
                  <div className="flex justify-between text-xs font-normal tabular-nums text-dark/45 dark:text-white/45">
                    <span>{formatNumber(scale!.lo, locale)}</span>
                    <span>{formatNumber(scale!.hi, locale)}</span>
                  </div>
                </th>
              ) : null}
              {showConfidence ? (
                <th
                  className={`${cellPad} w-px whitespace-nowrap text-xs font-medium text-dark/60 dark:text-white/60 border-b border-dark/10 dark:border-white/15`}
                >
                  {t('confidence')}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {resolvedRows.map((row, ri) => (
              <tr
                key={row.key}
                className={`relative ${
                  row.current
                    ? 'bg-primary/[0.07] dark:bg-primary/[0.12]'
                    : 'odd:bg-transparent even:bg-dark/[0.02] dark:even:bg-white/[0.03]'
                } ${row.href ? 'hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors' : ''}`}
              >
                <td className={`${bodyCell} font-medium text-dark dark:text-white text-sm sm:text-base min-w-[10rem]`}>
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
                    className={`${bodyCell} text-dark/85 dark:text-white/85 text-sm sm:text-base tabular-nums whitespace-nowrap`}
                  >
                    {cell || '—'}
                  </td>
                ))}
                {showBars ? (
                  <td className={bodyCell}>
                    <RangeBar range={ranges[ri] ?? null} scale={scale!} muted={hasCurrent && !row.current} />
                  </td>
                ) : null}
                {showConfidence ? (
                  <td className={`${bodyCell} text-center`}>
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
        {resolvedRows.map((row, ri) => {
          const card = (
            <div
              className={`rounded-2xl border p-4 ${
                row.current
                  ? 'border-primary/40 bg-primary/[0.07] dark:bg-primary/[0.12]'
                  : 'border-dark/10 dark:border-white/15'
              }`}
            >
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
                    <dd className="text-dark/85 dark:text-white/85 text-right tabular-nums">{cell || '—'}</dd>
                  </div>
                ))}
              </dl>
              {showBars ? (
                <div className="mt-3">
                  <RangeBar range={ranges[ri] ?? null} scale={scale!} muted={hasCurrent && !row.current} />
                </div>
              ) : null}
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

      {sourceNote || lastUpdated || levelsShown.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-dark/50 dark:text-white/50">
          {sourceNote || lastUpdated ? (
            <p>
              {sourceNote}
              {sourceNote && lastUpdated ? ' · ' : ''}
              {lastUpdated ? t('updatedAt', { date: formatBlogDate(lastUpdated, locale) }) : ''}
            </p>
          ) : null}
          {levelsShown.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {levelsShown.map((level) => (
                <li key={level} className="inline-flex items-center gap-1.5">
                  <ConfidenceDot level={level} label={confidenceLabel(level)} />
                  {confidenceLabel(level)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {showCta ? (
        <div className="mt-8">
          <RowLink href={ctaHref} locale={locale} className={brandButtonClass('primary')}>
            {ctaLabel}
          </RowLink>
        </div>
      ) : null}
    </>
  )

  return (
    <Section>
      <SectionHeading title={title || undefined} lead={subtitle || undefined} />
      {asideBeside ? (
        <div className={SPLIT}>
          <div className={SPLIT_MAIN}>{table}</div>
          <div className={cn(SPLIT_ASIDE, 'lg:pt-1')}>{aside}</div>
        </div>
      ) : (
        <>
          {table}
          {aside ? <div className={cn(MEASURE, 'mt-8')}>{aside}</div> : null}
        </>
      )}
    </Section>
  )
}
