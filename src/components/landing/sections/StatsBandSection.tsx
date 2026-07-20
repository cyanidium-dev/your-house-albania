import * as React from 'react'
import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { resolveLocalizedString } from '@/lib/sanity/localized'
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

/** Static class map — Tailwind cannot see dynamically built class names. */
const DESKTOP_COLS: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
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

/**
 * Key figures band: large value + label grid (2 cols mobile → up to 6 desktop),
 * optional trend arrows and confidence dots. Server component.
 */
export function StatsBandSection({
  locale,
  section,
}: {
  locale: string
  section: StatsBandSectionShape
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
  const colsClass = DESKTOP_COLS[Math.min(Math.max(items.length, 2), 6)]

  const confidenceLabel = (level: ConfidenceLevel) =>
    level === 'high'
      ? t('confidenceHigh')
      : level === 'medium'
        ? t('confidenceMedium')
        : t('confidenceLow')

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {title ? (
          <h2 className="mb-10 max-w-3xl text-3xl sm:text-4xl lg:text-52 font-medium text-dark dark:text-white leading-[1.15]">
            {title}
          </h2>
        ) : null}

        <div className={`grid grid-cols-2 md:grid-cols-3 ${colsClass} gap-6 md:gap-8`}>
          {items.map((it, i) => {
            const label = resolveLocalizedString(it.label as never, locale) || ''
            const sublabel = resolveLocalizedString(it.sublabel as never, locale) || ''
            const confidence = asConfidenceLevel(it.confidence)
            return (
              <div key={it._key ?? i} className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-3xl sm:text-4xl font-medium tracking-tight text-dark dark:text-white">
                    {it.value}
                  </span>
                  {it.trend ? <TrendIcon trend={it.trend} /> : null}
                  {confidence ? (
                    <ConfidenceDot level={confidence} label={confidenceLabel(confidence)} />
                  ) : null}
                </div>
                {label ? (
                  <div className="mt-2 text-sm sm:text-base font-medium text-dark/75 dark:text-white/75">
                    {label}
                  </div>
                ) : null}
                {sublabel ? (
                  <div className="mt-1 text-xs sm:text-sm text-dark/50 dark:text-white/50">
                    {sublabel}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {(sourceNote || lastUpdated) ? (
          <p className="mt-6 text-xs text-dark/50 dark:text-white/50">
            {sourceNote}
            {sourceNote && lastUpdated ? ' · ' : ''}
            {lastUpdated ? t('updatedAt', { date: formatBlogDate(lastUpdated, locale) }) : ''}
          </p>
        ) : null}
      </div>
    </section>
  )
}
