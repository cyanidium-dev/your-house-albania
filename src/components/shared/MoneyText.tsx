"use client"

import { useCurrency } from '@/contexts/CurrencyContext'
import { convertFromBaseEur } from '@/lib/currency/convert'
import { formatMoney } from '@/lib/currency/format'

/**
 * A EUR amount in the visitor's currency, formatted for the page locale — the
 * same conversion the property cards use. `suffix` follows the amount ("/m²").
 * Renders in EUR on the server and until the visitor's currency is known.
 */
export function MoneyText({
  amountEur,
  locale,
  suffix,
  className,
}: {
  amountEur: number
  locale: string
  suffix?: string
  className?: string
}) {
  const { currency, rates } = useCurrency()
  const amount = formatMoney(convertFromBaseEur(amountEur, currency, rates), currency, locale)
  return (
    <span className={className}>
      {amount}
      {suffix ?? ''}
    </span>
  )
}
