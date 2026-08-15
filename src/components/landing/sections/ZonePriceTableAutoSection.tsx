import * as React from 'react'
import { useTranslations } from 'next-intl'
import { PriceTableSection } from '@/components/landing/sections/PriceTableSection'
import { SourcesList, type SourcesListItem } from '@/components/landing/sections/impl/SourcesList'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import {
  formatMetric,
  isMetricKey,
  latestPeriodLabel,
  mergeSources,
  METRIC_KEYS,
  type MetricKey,
} from '@/lib/zoneMetrics/metrics'
import type { ZoneMetricsDoc } from '@/lib/sanity/queries/zoneMetrics'

const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value })

/** Columns an editor gets by default: the four figures most zones actually carry. */
const DEFAULT_COLUMNS: MetricKey[] = ['priceNew', 'priceResale', 'priceAll', 'referencePrice']

export type ZoneTableSort = 'price' | 'rating' | 'manual'

function sortValue(record: ZoneMetricsDoc, sort: ZoneTableSort): number {
  if (sort === 'rating') return record.ratingOverall ?? -Infinity
  return (
    record.priceAllMedian ??
    record.priceNewMedian ??
    record.priceAllMax ??
    record.priceNewMax ??
    record.priceAllMin ??
    record.priceNewMin ??
    -Infinity
  )
}

function zoneHref(record: ZoneMetricsDoc): string | undefined {
  const zone = record.zone
  if (!zone?.slug) return undefined
  const country = zone.countrySlug ?? 'albania'
  if (zone._type === 'district') {
    if (!zone.citySlug) return undefined
    return `/${country}/${zone.citySlug}/districts/${zone.slug}`
  }
  return `/${country}/${zone.slug}/info`
}

/**
 * Price table built from `zoneMetrics` records, rendered through the manual
 * `priceTableSection` UI.
 *
 * Columns hold only metrics at least one record can fill, so a table never
 * carries a column of dashes; zones with no record never reach this component,
 * so there are no blank rows either.
 */
export function ZonePriceTableAutoSection({
  locale,
  records,
  titleOverride,
  subtitleOverride,
  columns,
  sortBy = 'price',
  linkRows = true,
  showSources = true,
}: {
  locale: string
  records: ZoneMetricsDoc[]
  titleOverride?: string
  subtitleOverride?: string
  columns?: unknown
  sortBy?: ZoneTableSort
  linkRows?: boolean
  showSources?: boolean
}) {
  const t = useTranslations('ZoneMetrics')

  const rows = (Array.isArray(records) ? records : []).filter((r) => r && r.zone)
  if (rows.length === 0) return null

  const requested = Array.isArray(columns) ? columns.filter(isMetricKey) : []
  const candidates: MetricKey[] = requested.length > 0 ? requested : DEFAULT_COLUMNS
  // Keep a column only when some row can fill it.
  const activeColumns = candidates.filter((key) =>
    rows.some((record) => formatMetric(record, key, locale) !== null),
  )
  const columnKeys: MetricKey[] =
    activeColumns.length > 0
      ? activeColumns
      : METRIC_KEYS.filter((key) => rows.some((r) => formatMetric(r, key, locale) !== null)).slice(0, 4)

  if (columnKeys.length === 0) return null

  const sorted =
    sortBy === 'manual'
      ? rows
      : rows.slice().sort((a, b) => sortValue(b, sortBy) - sortValue(a, sortBy))

  const tableRows = sorted.map((record, i) => {
    const zoneLabel = resolveLocalizedString(record.zone?.title as never, locale) || record.zone?.slug || ''
    const href = linkRows ? zoneHref(record) : undefined
    return {
      _key: record._id ?? `row-${i}`,
      label: loc(zoneLabel),
      cells: columnKeys.map((key) => loc(formatMetric(record, key, locale) ?? '—')),
      confidence: record.confidence,
      ...(href ? { href } : {}),
    }
  })

  const period = latestPeriodLabel(sorted)
  const sources = mergeSources(sorted).filter((s): s is SourcesListItem => Boolean(s?.url && s?.label))

  return (
    <>
      <PriceTableSection
        locale={locale}
        section={{
          title: titleOverride ? loc(titleOverride) : undefined,
          subtitle: subtitleOverride ? loc(subtitleOverride) : undefined,
          columns: [loc(t('zone')), ...columnKeys.map((key) => loc(t(key)))],
          rows: tableRows,
          confidenceEnabled: true,
          sourceNote: period ? loc(period) : undefined,
        }}
      />
      {showSources && sources.length > 0 ? (
        <div className="container max-w-8xl mx-auto -mt-10 px-5 pb-16 md:pb-24 2xl:px-0">
          <div className="max-w-3xl">
            <SourcesList items={sources} locale={locale} />
          </div>
        </div>
      ) : null}
    </>
  )
}
