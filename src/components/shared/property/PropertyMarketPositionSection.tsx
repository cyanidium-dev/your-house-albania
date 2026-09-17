import * as React from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { districtInfoPath } from '@/lib/routes/catalog'
import { fetchCityCountrySlugByCitySlug, fetchDistrictBySlugs } from '@/lib/sanity/client'
import { MarketMoney } from '@/components/shared/property/MarketMoney'
import type { MarketPosition, MarketPositionLabel } from '@/lib/property/marketPosition'

const LABEL_KEY: Record<MarketPositionLabel, 'labelBelow' | 'labelIn' | 'labelAbove'> = {
  below: 'labelBelow',
  in: 'labelIn',
  above: 'labelAbove',
}

const LABEL_CLASS: Record<MarketPositionLabel, string> = {
  below: 'text-emerald-600 dark:text-emerald-400 border-emerald-600/30 dark:border-emerald-400/30',
  in: 'text-dark/70 dark:text-white/70 border-dark/20 dark:border-white/20',
  above: 'text-amber-600 dark:text-amber-400 border-amber-600/30 dark:border-amber-400/30',
}

/**
 * "Market in this district" block: price-position badge, reference price,
 * district yield, link to the district page. Renders nothing when there is
 * no market position (no district, or the district has no zoneMetrics) or
 * no district/city slug to link to.
 */
export async function PropertyMarketPositionSection({
  locale,
  marketPosition,
  citySlug,
  districtSlug,
}: {
  locale: string
  marketPosition: MarketPosition | null | undefined
  citySlug?: string | null
  districtSlug?: string | null
}) {
  if (!marketPosition || !citySlug || !districtSlug) return null

  const [t, districtPage, countrySlug] = await Promise.all([
    getTranslations('PropertyMarketPosition'),
    fetchDistrictBySlugs(citySlug, districtSlug),
    fetchCityCountrySlugByCitySlug(citySlug),
  ])
  // A district can carry zoneMetrics without a published page (Spitallë): the
  // market verdict still stands, but the link would be a 404.
  const href = districtPage ? districtInfoPath(locale, citySlug, districtSlug, countrySlug) : null

  // Everything below is scaled to this flat. A district's €/m² band and the
  // state schedule's lek/m² rate are both meaningless as a bare number next to
  // a total price, so each becomes "what that rate means for this area".
  const { area } = marketPosition
  const referenceLow = marketPosition.referencePriceMin ?? marketPosition.referencePrice
  const referenceHigh = marketPosition.referencePriceMax ?? marketPosition.referencePrice

  return (
    <div className="py-8 mt-8 border-t border-dark/5 dark:border-white/15">
      <h3 className="text-xl font-medium">{t('title')}</h3>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${LABEL_CLASS[marketPosition.label]}`}
        >
          {t(LABEL_KEY[marketPosition.label])}
        </span>
        <span className="text-sm text-dark/70 dark:text-white/70">
          {t('marketValue', { area: Math.round(area) })}:{' '}
          <MarketMoney min={marketPosition.rangeMin * area} max={marketPosition.rangeMax * area} step={1000} locale={locale} />
        </span>
        <span className="text-sm text-dark/70 dark:text-white/70">
          {t('thisListing')}:{' '}
          {t.rich('perSqm', {
            amount: () => <MarketMoney min={marketPosition.pricePerSqm} step={10} locale={locale} />,
          })}
        </span>
        {typeof referenceLow === 'number' && referenceLow > 0 && (
          <span className="text-sm text-dark/70 dark:text-white/70">
            {t('referenceValue')}:{' '}
            <MarketMoney
              min={referenceLow * area}
              max={typeof referenceHigh === 'number' ? referenceHigh * area : undefined}
              from="ALL"
              step={1000}
              locale={locale}
            />
          </span>
        )}
        {typeof marketPosition.grossYieldPct === 'number' && (
          <span className="text-sm text-dark/70 dark:text-white/70">
            {t('districtYield', { pct: marketPosition.grossYieldPct })}
          </span>
        )}
      </div>
      {href && (
        <Link href={href} className="mt-3 inline-block text-sm text-primary hover:underline">
          {t('viewDistrict')}
        </Link>
      )}
      <p className="mt-2 text-xs text-dark/40 dark:text-white/40">{t('disclaimer')}</p>
    </div>
  )
}
