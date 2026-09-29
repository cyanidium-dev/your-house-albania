import * as React from 'react'
import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { cn } from '@/lib/utils'
import { parseNumericRange } from '@/lib/format/numericRange'
import { PANEL, Section, SectionHeading, SPLIT, SPLIT_ASIDE, SPLIT_MAIN } from '@/components/shared/layout'
import { formatBlogDate } from '@/lib/date/formatLocale'
import {
  asConfidenceLevel,
  ConfidenceDot,
  type ConfidenceLevel,
} from '@/components/landing/sections/impl/ConfidenceDot'

type StatsBandItem = {
  _key?: string
  value?: string
  label?: unknown
  sublabel?: unknown
  trend?: string
  confidence?: string
}

type StatsBandSectionShape = {
  enabled?: boolean
  title?: unknown
  items?: unknown[]
  sourceNote?: unknown
  lastUpdated?: string
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <ArrowUp className="h-5 w-5 text-emerald-500" aria-hidden />
  if (trend === 'down') return <ArrowDown className="h-5 w-5 text-red-500" aria-hidden />
  if (trend === 'flat') return <Minus className="h-5 w-5 text-dark/40 dark:text-white/40" aria-hidden />
  return null
}

function Figure({
  item,
  locale,
  large,
  confidenceLabel,
}: {
  item: StatsBandItem
  locale: string
  large: boolean
  confidenceLabel: (level: ConfidenceLevel) => string
}) {
  const label = resolveLocalizedString(item.label as never, locale) || ''
  const sublabel = resolveLocalizedString(item.sublabel as never, locale) || ''
  const confidence = asConfidenceLevel(item.confidence)
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'font-display font-medium tracking-tight tabular-nums sm:whitespace-nowrap text-dark dark:text-white',
            large ? 'text-4xl sm:text-5xl' : 'text-[1.75rem] sm:text-3xl',
          )}
        >
          {item.value}
        </span>
        {item.trend ? <TrendIcon trend={item.trend} /> : null}
        {confidence ? <ConfidenceDot level={confidence} label={confidenceLabel(confidence)} /> : null}
      </div>
      {label ? (
        <div className="mt-2 text-sm sm:text-base font-medium text-dark/75 dark:text-white/75">{label}</div>
      ) : null}
      {sublabel ? <div className="mt-1 text-xs sm:text-sm text-dark/50 dark:text-white/50">{sublabel}</div> : null}
    </div>
  )
}

/**
 * Key figures. Two compositions, chosen by what the section carries:
 *
 * - with `aside` (the research note and sources of an automatic zone band):
 *   the figures in a panel on the narrow side of the split, the note beside
 *   them at a reading measure. A district usually has one or two figures, and
 *   the old full-width band showed one number at the left edge of a 1400px
 *   row with nothing else in it;
 * - without it: one panel per figure in a grid whose columns follow the count,
 *   so two figures (a comparison) fill the row as a pair.
 *
 * Server component.
 */
export function StatsBandSection({
  locale,
  section,
  aside,
}: {
  locale: string
  section: StatsBandSectionShape
  /** Notes and sources shown beside the figures. */
  aside?: React.ReactNode
}) {
  const t = useTranslations('Landing')
  if (section.enabled === false) return null

  const items = ((Array.isArray(section.items) ? section.items : []) as StatsBandItem[]).filter(
    (it) => it && typeof it.value === 'string' && it.value.trim(),
  )
  if (items.length === 0) return null

  const title = resolveLocalizedString(section.title as never, locale) || ''
  const sourceNote = resolveLocalizedString(section.sourceNote as never, locale) || ''
  const lastUpdated = parseDate(section.lastUpdated)

  const confidenceLabel = (level: ConfidenceLevel) =>
    level === 'high'
      ? t('confidenceHigh')
      : level === 'medium'
        ? t('confidenceMedium')
        : t('confidenceLow')

  const note =
    sourceNote || lastUpdated ? (
      <p className="text-xs text-dark/50 dark:text-white/50">
        {sourceNote}
        {sourceNote && lastUpdated ? ' · ' : ''}
        {lastUpdated ? t('updatedAt', { date: formatBlogDate(lastUpdated, locale) }) : ''}
      </p>
    ) : null

  if (aside) {
    return (
      <Section>
        <SectionHeading title={title || undefined} />
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <div className={cn(PANEL, 'p-6 sm:p-8')}>
              {/* One column on a phone: a range like "1,100–2,000" does not fit half of 335px. */}
              <div className={cn('grid gap-x-8 gap-y-7', items.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
                {items.map((it, i) => (
                  <Figure
                    key={it._key ?? i}
                    item={it}
                    locale={locale}
                    large={items.length === 1}
                    confidenceLabel={confidenceLabel}
                  />
                ))}
              </div>
              {note ? <div className="mt-6 pt-5 border-t border-dark/10 dark:border-white/10">{note}</div> : null}
            </div>
          </div>
          <div className={cn(SPLIT_MAIN, 'lg:pt-2')}>{aside}</div>
        </div>
      </Section>
    )
  }

  const cols =
    items.length <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : items.length === 3
        ? 'grid-cols-2 lg:grid-cols-3'
        : items.length === 4
          ? 'grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-2 md:grid-cols-3'

  // Two single figures in the same unit are a comparison (the /guides/*-vs-*
  // pages): the second panel says how far apart they are, so the reader does
  // not have to work out 1,300 against 1,450 themselves.
  const pair =
    items.length === 2
      ? items.map((it) => parseNumericRange(it.value ?? ''))
      : null
  const unit = (v?: string) => (v ?? '').replace(/[\d\s.,\u00a0\u202f–-]/g, '')
  const diffPct =
    pair && pair[0] && pair[1] && pair[0][0] === pair[0][1] && pair[1][0] === pair[1][1] &&
    unit(items[0].value) === unit(items[1].value) && pair[0][0] > 0
      ? Math.round(((pair[1][0] - pair[0][0]) / pair[0][0]) * 100)
      : null
  const firstLabel = resolveLocalizedString(items[0]?.label as never, locale) || ''

  return (
    <Section>
      <SectionHeading title={title || undefined} />
      <div className={cn('grid gap-4 md:gap-6', cols)}>
        {items.map((it, i) => (
          <div key={it._key ?? i} className={cn(PANEL, 'p-6 sm:p-8')}>
            <Figure item={it} locale={locale} large={items.length <= 2} confidenceLabel={confidenceLabel} />
            {i === 1 && diffPct !== null && diffPct !== 0 && firstLabel ? (
              <p className="mt-4 inline-flex items-center rounded-full bg-primary/12 px-3 py-1 text-sm font-semibold text-primary tabular-nums">
                {t('versus', { diff: `${diffPct > 0 ? '+' : '−'}${Math.abs(diffPct)}%`, other: firstLabel })}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      {note ? <div className="mt-5">{note}</div> : null}
    </Section>
  )
}
