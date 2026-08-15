import * as React from 'react'
import { useTranslations } from 'next-intl'
import { StatsBandSection } from '@/components/landing/sections/StatsBandSection'
import { SourcesList, type SourcesListItem } from '@/components/landing/sections/impl/SourcesList'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { formatMetric, resolveSelectedMetrics, type MetricKey } from '@/lib/zoneMetrics/metrics'
import type { ZoneMetricsDoc } from '@/lib/sanity/queries/zoneMetrics'

/** Same string in every locale: the value is already translated at this point. */
const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value })

const BASIS_KEY: Record<string, string> = {
  asking: 'basisAsking',
  transaction: 'basisTransaction',
  official: 'basisOfficial',
  calculated: 'basisCalculated',
  mixed: 'basisMixed',
}

/**
 * Key figures for one zone, read from its newest `zoneMetrics` record and
 * rendered through the manual `statsBandSection` UI, so a page mixing manual
 * and automatic bands looks like one page.
 *
 * Renders nothing when the zone has no record or the record holds none of the
 * requested metrics — an empty band reads as "we have no idea" in exactly the
 * place a reader is looking for a number.
 */
export function ZoneStatsAutoSection({
  locale,
  record,
  titleOverride,
  metrics,
  showSources = true,
}: {
  locale: string
  record: ZoneMetricsDoc | null
  titleOverride?: string
  metrics?: unknown
  showSources?: boolean
}) {
  const t = useTranslations('ZoneMetrics')

  if (!record) return null

  const keys: MetricKey[] = resolveSelectedMetrics(record, metrics, locale)
  const items = keys
    .map((key) => {
      const value = formatMetric(record, key, locale)
      if (!value) return null
      return {
        _key: key,
        value,
        label: loc(t(key)),
        confidence: key === 'referencePrice' ? 'high' : record.confidence,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  if (items.length === 0) return null

  const basisKey = BASIS_KEY[record.basis ?? '']
  const noteParts = [
    basisKey ? t(basisKey) : undefined,
    typeof record.sampleSize === 'number' ? t('sample', { n: record.sampleSize }) : undefined,
    record.periodLabel,
    record.referencePriceEdition && keys.includes('referencePrice')
      ? t('referenceEdition', { edition: record.referencePriceEdition })
      : undefined,
  ].filter(Boolean)

  const notes = resolveLocalizedString(record.notes as never, locale)
  const sources = (record.sources ?? []).filter(
    (s): s is SourcesListItem => Boolean(s?.url && s?.label),
  )

  return (
    <>
      <StatsBandSection
        locale={locale}
        section={{
          title: titleOverride ? loc(titleOverride) : undefined,
          items,
          sourceNote: noteParts.length ? loc(noteParts.join(' · ')) : undefined,
        }}
      />
      {(notes || (showSources && sources.length > 0)) ? (
        <div className="container max-w-8xl mx-auto -mt-10 px-5 pb-16 md:pb-24 2xl:px-0">
          {notes ? (
            <p className="max-w-3xl text-sm text-dark/60 dark:text-white/60">{notes}</p>
          ) : null}
          {showSources && sources.length > 0 ? (
            <div className="mt-4 max-w-3xl">
              <SourcesList items={sources} locale={locale} />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
