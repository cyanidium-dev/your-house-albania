'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { calculateMortgage } from '@/lib/calculators/mortgage'
import {
  CalcEmptyState,
  CalcLayout,
  CalcMoney,
  CalcNotice,
  CalcNumberInput,
  CalcResultsCard,
  CalcResultStat,
  CalcSliderField,
  formatPct,
} from './CalcUi'

const PRICE_MIN = 20_000
const PRICE_MAX = 2_000_000
const PRICE_STEP = 5_000

export type MortgageCalcConfig = {
  defaultRatePct: number
  minRatePct: number
  maxRatePct: number
  maxLtvPct: number
  defaultTermYears: number
  maxTermYears: number
}

export function MortgageCalcClient({
  locale,
  config,
}: {
  locale: string
  config: MortgageCalcConfig
}) {
  const t = useTranslations('Calculators')
  const minDownPct = Math.max(0, 100 - config.maxLtvPct)

  const [price, setPrice] = React.useState<number | ''>(100_000)
  const [downPct, setDownPct] = React.useState<number>(minDownPct)
  const [ratePct, setRatePct] = React.useState<number>(config.defaultRatePct)
  const [termYears, setTermYears] = React.useState<number>(config.defaultTermYears)

  const priceNum = typeof price === 'number' ? price : 0
  const result =
    priceNum > 0
      ? calculateMortgage({
          priceEur: priceNum,
          downPaymentPct: downPct,
          annualRatePct: ratePct,
          termYears,
          maxLtvPct: config.maxLtvPct,
        })
      : null

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
      {/* Slider allows going below the regulatory minimum on purpose: the LTV
          indicator then shows a warning (not a hard block), per spec. */}
      <CalcSliderField
        label={t('downPayment')}
        valueDisplay={formatPct(downPct, locale, 0)}
        min={0}
        max={100}
        step={1}
        value={downPct}
        onValueChange={setDownPct}
      />
      <CalcSliderField
        label={t('interestRate')}
        valueDisplay={formatPct(ratePct, locale, 2)}
        min={config.minRatePct}
        max={config.maxRatePct}
        step={0.1}
        value={ratePct}
        onValueChange={setRatePct}
      />
      <CalcSliderField
        label={t('loanTerm')}
        valueDisplay={`${termYears} ${t('years')}`}
        min={5}
        max={config.maxTermYears}
        step={1}
        value={termYears}
        onValueChange={setTermYears}
      />
    </>
  )

  const results = (
    <CalcResultsCard>
      {result ? (
        <>
          <CalcResultStat
            primary
            animateKey={Math.round(result.monthlyPaymentEur)}
            value={<CalcMoney amountEur={result.monthlyPaymentEur} locale={locale} />}
            label={t('monthlyPayment')}
          />
          <div className="grid grid-cols-3 gap-4 border-t border-dark/10 dark:border-white/10 pt-4">
            <CalcResultStat
              animateKey={Math.round(result.loanEur)}
              value={<CalcMoney amountEur={result.loanEur} locale={locale} />}
              label={t('loanAmount')}
            />
            <CalcResultStat
              animateKey={Math.round(result.totalInterestEur)}
              value={<CalcMoney amountEur={result.totalInterestEur} locale={locale} />}
              label={t('totalInterest')}
            />
            <CalcResultStat
              animateKey={Math.round(result.ltvPct)}
              value={formatPct(result.ltvPct, locale, 0)}
              label={t('ltvLabel')}
            />
          </div>
          {result.exceedsLtvLimit ? (
            <CalcNotice tone="warn">{t('ltvExceeded', { limit: config.maxLtvPct })}</CalcNotice>
          ) : (
            <CalcNotice tone="ok">{t('ltvOk')}</CalcNotice>
          )}
        </>
      ) : (
        <CalcEmptyState text={t('enterPrice')} />
      )}
    </CalcResultsCard>
  )

  return <CalcLayout inputs={inputs} results={results} />
}
