import * as React from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { districtInfoPath } from '@/lib/routes/catalog'
import { PriceText } from '@/components/shared/PriceText'
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

  const t = await getTranslations('PropertyMarketPosition')
  const href = districtInfoPath(locale, citySlug, districtSlug)

  return (
    <div className="py-8 mt-8 border-t border-dark/5 dark:border-white/15">
      <h3 className="text-xl font-medium">{t('title')}</h3>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${LABEL_CLASS[marketPosition.label]}`}
        >
          {t(LABEL_KEY[marketPosition.label])}
        </span>
        {typeof marketPosition.referencePrice === 'number' && (
          <span className="text-sm text-dark/70 dark:text-white/70">
            {t('referencePrice')}: <PriceText amountEur={marketPosition.referencePrice} locale={locale} />
          </span>
        )}
        {typeof marketPosition.grossYieldPct === 'number' && (
          <span className="text-sm text-dark/70 dark:text-white/70">
            {t('districtYield', { pct: marketPosition.grossYieldPct })}
          </span>
        )}
      </div>
      <Link href={href} className="mt-3 inline-block text-sm text-primary hover:underline">
        {t('viewDistrict')}
      </Link>
      <p className="mt-2 text-xs text-dark/40 dark:text-white/40">{t('disclaimer')}</p>
    </div>
  )
}
