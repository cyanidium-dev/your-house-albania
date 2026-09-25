import * as React from 'react'
import { getFormatter, getTranslations } from 'next-intl/server'
import { MarketMoney } from '@/components/shared/property/MarketMoney'
import { priceHistorySteps, type PriceHistoryEntry } from '@/lib/property/priceHistory'

/**
 * "Asking price on Domlivo": when the listing was first published here and
 * every price it has carried since. One line for a listing whose price never
 * moved; a dated list when it did. Renders nothing without a dated price.
 */
export async function PropertyPriceHistorySection({
  locale,
  history,
}: {
  locale: string
  history: readonly (Partial<PriceHistoryEntry> | null | undefined)[] | null | undefined
}) {
  const steps = priceHistorySteps(history)
  if (steps.length === 0) return null
  const [t, format] = await Promise.all([getTranslations('PropertyPriceHistory'), getFormatter()])
  const day = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00Z`), { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
  const first = steps[0]
  const perSqm = (unit?: string | null) => unit === 'per-sqm'

  return (
    <div className="py-8 mt-8 border-t border-dark/5 dark:border-white/15">
      <h3 className="text-xl font-medium">{t('title')}</h3>
      <p className="mt-3 text-sm text-dark/70 dark:text-white/70">
        {t.rich('listedAt', {
          date: day(first.date),
          amount: () => (
            <>
              <MarketMoney min={first.price} step={1} locale={locale} />
              {perSqm(first.priceUnit) ? t('perSqm') : ''}
            </>
          ),
        })}
        {steps.length === 1 ? ` ${t('unchanged')}` : ''}
      </p>
      {steps.length > 1 && (
        <dl className="mt-3 space-y-1 text-sm">
          {steps.slice(1).map((step) => (
            <div key={step.date} className="flex justify-between gap-4">
              <dt className="text-dark/70 dark:text-white/70">{day(step.date)}</dt>
              <dd className="whitespace-nowrap">
                <MarketMoney min={step.price} step={1} locale={locale} />
                {perSqm(step.priceUnit) ? t('perSqm') : ''}
                {typeof step.changePct === 'number' ? (
                  <span className={`ml-2 ${step.changePct < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {step.changePct > 0 ? '+' : ''}
                    {step.changePct}%
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-3 text-xs text-dark/50 dark:text-white/50">{t('note')}</p>
    </div>
  )
}
