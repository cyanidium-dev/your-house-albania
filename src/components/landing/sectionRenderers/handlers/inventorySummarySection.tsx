import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { StatsBandSection } from '@/components/landing/sections'
import type { StatsBandItem } from '@/components/landing/sections/StatsBandSection'
import { MoneyText } from '@/components/shared/MoneyText'
import { fetchCatalogInventorySummary } from '@/lib/sanity/client'
import { formatMoney } from '@/lib/currency/format'
import {
  INVENTORY_METRICS,
  isInventoryMetric,
  type InventoryMetric,
  type InventorySummary,
} from '@/lib/catalog/inventorySummary'
import { normalizeLandingListingFilter, resolveLandingListingScope } from '@/lib/landing/listingFilter'
import type { SectionHandler } from './types'

/** Shown when the editor picked no metrics: the four a buyer reads first. */
const DEFAULT_METRICS: readonly InventoryMetric[] = ['count', 'fromPrice', 'medianPricePerSqm', 'nearSeaShare']

export function inventoryMetricsOf(raw: unknown): InventoryMetric[] {
  const picked = Array.isArray(raw) ? raw.filter(isInventoryMetric) : []
  const unique = INVENTORY_METRICS.filter((m) => picked.includes(m))
  return unique.length ? unique : [...DEFAULT_METRICS]
}

/**
 * Live inventory band (auto): count, from-price, median EUR/m², near-sea and
 * new-build shares for the section's catalogue filter — the same filter shape
 * as the property carousel, so a band above a feed describes exactly that
 * feed. Computed at render from the hourly-cached catalogue query; amounts are
 * EUR on the server and follow the visitor's currency in the browser.
 */
export const inventorySummarySectionHandler: SectionHandler = async ({ locale, section, citySlug, linkedZone }) => {
  if (section.enabled === false) return null
  const scope =
    resolveLandingListingScope(normalizeLandingListingFilter((section as { filters?: unknown }).filters), {
      linkedZone,
      citySlug,
    }) ?? {}
  const [summary, t] = await Promise.all([
    fetchCatalogInventorySummary(scope),
    getTranslations({ locale, namespace: 'Landing.inventory' }),
  ])
  if (!summary || summary.count === 0) return null

  const items = inventoryMetricsOf(section.metrics)
    .map((metric) => inventoryItem(metric, summary, locale, t))
    .filter((x): x is StatsBandItem => x !== null)
  if (items.length === 0) return null

  return (
    <StatsBandSection
      key={section._key ?? 'inventory-summary'}
      locale={locale}
      section={{
        title: section.title,
        items,
        sourceNote: { en: t('note') },
      }}
    />
  )
}

function inventoryItem(
  metric: InventoryMetric,
  s: InventorySummary,
  locale: string,
  t: (key: string) => string,
): StatsBandItem | null {
  const label = { en: t(metric) }
  const percent = (v: number) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(v / 100)
  switch (metric) {
    case 'count':
      return { _key: metric, value: new Intl.NumberFormat(locale).format(s.count), label }
    case 'fromPrice':
      return s.fromPrice
        ? {
            _key: metric,
            value: formatMoney(s.fromPrice, 'EUR', locale),
            display: <MoneyText amountEur={s.fromPrice} locale={locale} />,
            label,
          }
        : null
    case 'medianPricePerSqm':
      return s.medianPricePerSqm
        ? {
            _key: metric,
            value: `${formatMoney(s.medianPricePerSqm, 'EUR', locale)}/m²`,
            display: <MoneyText amountEur={s.medianPricePerSqm} locale={locale} suffix="/m²" />,
            label,
          }
        : null
    case 'nearSeaShare':
      return s.nearSeaShare !== null ? { _key: metric, value: percent(s.nearSeaShare), label } : null
    case 'newBuildShare':
      return s.newBuildShare !== null ? { _key: metric, value: percent(s.newBuildShare), label } : null
  }
}
