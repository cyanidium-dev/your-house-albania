import type { CurrencyCode } from './types'

/**
 * Returns the currency symbol for display (e.g. €, $, ₴).
 * Uses Intl; falls back to code if Intl fails.
 */
export function getCurrencySymbol(code: CurrencyCode, locale = 'en'): string {
  const c = typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : 'EUR'
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: c,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(1)
    const currencyPart = parts.find((p) => p.type === 'currency')
    return currencyPart?.value ?? c
  } catch {
    return c
  }
}

/**
 * Formats amount with currency using Intl.NumberFormat.
 * Supports any ISO 4217 currency code from Sanity displayCurrencies.
 */
export function formatMoney(amount: number, currency: CurrencyCode, locale: string): string {
  const code = typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'EUR'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    const rounded = Math.round(amount).toLocaleString(locale)
    return `${rounded} ${code}`
  }
}

