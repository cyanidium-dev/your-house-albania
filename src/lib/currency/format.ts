import type { CurrencyCode } from './types'

export function formatMoney(amount: number, currency: CurrencyCode, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    const rounded = Math.round(amount).toLocaleString()
    const symbol = currency === 'USD' ? '$' : '€'
    return `${symbol}${rounded}`
  }
}

