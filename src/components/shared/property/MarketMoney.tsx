'use client'

import { useCurrency } from '@/contexts/CurrencyContext'
import { convertFromBaseEur } from '@/lib/currency/convert'
import { formatMoney } from '@/lib/currency/format'
import { ALL_PER_EUR } from '@/lib/calculators/utilities'

/** Rounds to a step that does not pretend to more precision than a district band has. */
function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

/**
 * An amount or a range in the visitor's chosen currency.
 *
 * `lek` amounts are converted with the site's own ALL rate when the currency
 * settings carry one, and with the research rate otherwise — the state
 * reference schedule is published in lek, and printing that number with a
 * euro sign is how a 78 m² flat once showed a "reference price" of 56,500 EUR.
 */
export function MarketMoney({
  min,
  max,
  from = 'EUR',
  step = 100,
  locale,
}: {
  min: number
  max?: number
  from?: 'EUR' | 'ALL'
  step?: number
  locale: string
}) {
  const { currency, rates } = useCurrency()
  const allPerEur = typeof rates.rates.ALL === 'number' && rates.rates.ALL > 0 ? rates.rates.ALL : ALL_PER_EUR
  const toEur = (amount: number) => (from === 'ALL' ? amount / allPerEur : amount)
  const show = (amount: number) =>
    formatMoney(roundTo(convertFromBaseEur(toEur(amount), currency, rates), step), currency, locale)

  if (typeof max !== 'number' || Math.abs(max - min) < step) return <>{show(min)}</>
  return (
    <>
      {show(min)} – {show(max)}
    </>
  )
}
