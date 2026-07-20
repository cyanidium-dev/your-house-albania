'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import { calculatePurchaseCost, type PurchaseCostItem } from '@/lib/calculators/purchaseCost'
import {
  CalcBreakdownRow,
  CalcChip,
  CalcEmptyState,
  CalcLayout,
  CalcMoney,
  CalcNumberInput,
  CalcResultsCard,
  CalcResultStat,
  CalcSliderField,
  formatPct,
} from './CalcUi'

const PRICE_MIN = 20_000
const PRICE_MAX = 2_000_000
const PRICE_STEP = 5_000

export function PurchaseCostCalcClient({
  locale,
  items,
}: {
  locale: string
  /** Labels/notes already localized on the server. */
  items: PurchaseCostItem[]
}) {
  const t = useTranslations('Calculators')
  const [price, setPrice] = React.useState<number | ''>(100_000)

  const priceNum = typeof price === 'number' ? price : 0
  const result = priceNum > 0 ? calculatePurchaseCost(priceNum, items) : null

  const inputs = (
    <>
      <CalcNumberInput
        label={t('propertyPrice')}
        value={price}
        onChange={setPrice}
        locale={locale}
        min={0}
        suffix="€"
      />
      <CalcSliderField
        label={t('propertyPrice')}
        valueDisplay={`€${new Intl.NumberFormat(locale).format(Math.min(Math.max(priceNum, PRICE_MIN), PRICE_MAX))}`}
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={PRICE_STEP}
        value={Math.min(Math.max(priceNum || PRICE_MIN, PRICE_MIN), PRICE_MAX)}
        onValueChange={(v) => setPrice(v)}
      />
      {result ? (
        <dl className="mt-2 flex flex-col text-sm">
          {result.lines.map((line, i) => (
            <CalcBreakdownRow
              key={i}
              label={
                <>
                  <span className="min-w-0 truncate">{line.label}</span>
                  {line.capped ? <CalcChip>{t('capped')}</CalcChip> : null}
                  {line.note ? (
                    <span title={line.note} aria-label={line.note} className="inline-flex shrink-0">
                      <Info className="h-3.5 w-3.5 text-dark/40 dark:text-white/40" aria-hidden />
                    </span>
                  ) : null}
                </>
              }
            >
              <CalcMoney amountEur={line.amountEur} locale={locale} />
            </CalcBreakdownRow>
          ))}
        </dl>
      ) : null}
    </>
  )

  const results = (
    <CalcResultsCard>
      {result ? (
        <>
          <CalcResultStat
            primary
            animateKey={Math.round(result.totalWithPriceEur)}
            value={<CalcMoney amountEur={result.totalWithPriceEur} locale={locale} />}
            label={t('totalPurchaseCost')}
          />
          <div className="grid grid-cols-2 gap-4 border-t border-dark/10 dark:border-white/10 pt-4">
            <CalcResultStat
              animateKey={Math.round(result.totalCostsEur)}
              value={<CalcMoney amountEur={result.totalCostsEur} locale={locale} />}
              label={t('transactionCosts')}
            />
            <CalcResultStat
              animateKey={result.overheadPct.toFixed(2)}
              value={formatPct(result.overheadPct, locale, 2)}
              label={t('onTopOfPrice')}
            />
          </div>
        </>
      ) : (
        <CalcEmptyState text={t('enterPrice')} />
      )}
    </CalcResultsCard>
  )

  return <CalcLayout inputs={inputs} results={results} />
}
