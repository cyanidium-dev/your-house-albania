import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { MarketMoney } from '@/components/shared/property/MarketMoney'
import type { CostLineKey, DistrictPriceRank, OwnershipCosts } from '@/lib/property/ownershipCosts'

/** Within this many percent of the median, "at the median" says it better than a number. */
const AT_MEDIAN_PCT = 3

const LINE_KEY: Record<CostLineKey, 'notary' | 'registration' | 'agency' | 'propertyTax' | 'utilities'> = {
  notary: 'notary',
  registration: 'registration',
  agency: 'agency',
  propertyTax: 'propertyTax',
  utilities: 'utilities',
}

/**
 * "What this flat really costs": its €/m² against the district's other
 * listings, the one-off fees of buying it and the yearly cost of holding it.
 * Every figure is computed for this listing — it is the part of a partner
 * listing's page that exists nowhere else. Renders nothing when there is
 * neither a cost breakdown nor a district comparison.
 */
export async function PropertyOwnershipCostsSection({
  locale,
  costs,
  rank,
  districtName,
  area,
  rateEur,
}: {
  locale: string
  costs: OwnershipCosts | null
  rank: DistrictPriceRank | null
  districtName?: string | null
  area?: number | null
  /** The per-m² rate, when the listing is priced that way. */
  rateEur?: number | null
}) {
  if (!costs && !rank) return null
  const t = await getTranslations('PropertyOwnershipCosts')

  const diff = rank ? Math.round(rank.diffPct) : 0
  const verdict = rank
    ? Math.abs(rank.diffPct) < AT_MEDIAN_PCT
      ? t('atMedian')
      : diff < 0
        ? t('belowMedian', { pct: Math.abs(diff) })
        : t('aboveMedian', { pct: diff })
    : null

  return (
    <div className="py-8 mt-8 border-t border-dark/5 dark:border-white/15">
      <h3 className="text-xl font-medium">{t('title')}</h3>

      {rank && (
        <p className="mt-4 text-sm text-dark/70 dark:text-white/70">
          <span
            className={`mr-2 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${
              diff < -AT_MEDIAN_PCT
                ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600/30 dark:border-emerald-400/30'
                : 'text-dark/70 dark:text-white/70 border-dark/20 dark:border-white/20'
            }`}
          >
            {verdict}
          </span>
          {t.rich(districtName ? 'districtMedian' : 'districtMedianNoName', {
            district: districtName ?? '',
            count: rank.count,
            amount: () => <MarketMoney min={rank.medianPerSqm} step={10} locale={locale} />,
          })}
        </p>
      )}

      {costs && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h4 className="text-base font-medium">{t('purchaseTitle')}</h4>
            <dl className="mt-3 space-y-2 text-sm">
              {costs.purchase.map((line) => (
                <div key={line.key} className="flex justify-between gap-4">
                  <dt className="text-dark/70 dark:text-white/70">{t(LINE_KEY[line.key])}</dt>
                  <dd className="whitespace-nowrap">
                    <MarketMoney min={line.eur} step={1} locale={locale} />
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-dark/10 pt-2 font-medium dark:border-white/15">
                <dt>
                  {t('purchaseTotal', {
                    pct: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(costs.purchasePct),
                  })}
                </dt>
                <dd className="whitespace-nowrap">
                  {/* Unrounded, so the total is the sum of the lines above it. */}
                  <MarketMoney min={costs.purchaseTotalEur} step={1} locale={locale} />
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-dark/50 dark:text-white/50">{t('transferTaxNote')}</p>
          </div>

          {costs.annual.length > 0 && (
            <div>
              <h4 className="text-base font-medium">{t('annualTitle')}</h4>
              <dl className="mt-3 space-y-2 text-sm">
                {costs.annual.map((line) => (
                  <div key={line.key} className="flex justify-between gap-4">
                    <dt className="text-dark/70 dark:text-white/70">{t(LINE_KEY[line.key])}</dt>
                    <dd className="whitespace-nowrap">
                      {t.rich('perYear', {
                        amount: () => <MarketMoney min={line.eur} step={line.eur >= 1000 ? 10 : 1} locale={locale} />,
                      })}
                    </dd>
                  </div>
                ))}
                {costs.monthlyEur !== null && (
                  <div className="flex justify-between gap-4 border-t border-dark/10 pt-2 font-medium dark:border-white/15">
                    <dt>{t('monthlyTotal')}</dt>
                    <dd className="whitespace-nowrap">
                      {t.rich('perMonth', {
                        amount: () => <MarketMoney min={costs.monthlyEur as number} step={1} locale={locale} />,
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      )}

      {costs?.totalFromRate && typeof area === 'number' && typeof rateEur === 'number' && (
        <p className="mt-4 text-xs text-dark/50 dark:text-white/50">
          {t.rich('fromRate', {
            area: Math.round(area),
            rate: () => <MarketMoney min={rateEur} step={10} locale={locale} />,
            total: () => <MarketMoney min={costs.totalPriceEur} step={100} locale={locale} />,
          })}
        </p>
      )}
      <p className="mt-2 text-xs text-dark/40 dark:text-white/40">{t('disclaimer')}</p>
    </div>
  )
}
