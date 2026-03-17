import type { CurrencyCode, ExchangeRates } from './types'

export function convertFromBaseEur(amountEur: number, to: CurrencyCode, rates: ExchangeRates): number {
  if (to === 'EUR') return amountEur
  const r = rates.rates[to]
  return amountEur * (typeof r === 'number' ? r : 1)
}

export function convertToBaseEur(amount: number, from: CurrencyCode, rates: ExchangeRates): number {
  if (from === 'EUR') return amount
  const r = rates.rates[from]
  if (!r) return amount
  return amount / r
}

