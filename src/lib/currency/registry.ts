import type { CurrencyCode } from './types'
import { getCurrencySymbol } from './format'

export type CurrencyMeta = {
  code: CurrencyCode
  symbol: string
}

/**
 * Returns metadata for a currency code. Symbol is derived from Intl.
 * Use displayCurrencies from useCurrency() for the list of available currencies.
 */
export function getCurrencyMeta(code: CurrencyCode, locale?: string): CurrencyMeta {
  const c = typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : 'EUR'
  return {
    code: c,
    symbol: getCurrencySymbol(c, locale),
  }
}

