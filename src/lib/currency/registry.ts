import type { CurrencyCode } from './types'
import { getCurrencySymbol } from './format'
import { resolveCurrencyDisplaySymbol } from './currencySymbolMap'

export type CurrencyMeta = {
  code: CurrencyCode
  symbol: string
}

/**
 * Symbol: Intl for (code, locale), then {@link resolveCurrencyDisplaySymbol} fallback
 * (same map as cron) when Intl yields only the ISO code — keeps picker aligned with price formatting.
 */
export function getCurrencyMeta(code: CurrencyCode, locale?: string): CurrencyMeta {
  const c = typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : 'EUR'
  let symbol = getCurrencySymbol(c, locale)
  if (!symbol || symbol === c) {
    const fb = resolveCurrencyDisplaySymbol(c, undefined)
    if (fb) symbol = fb
  }
  return { code: c, symbol }
}

