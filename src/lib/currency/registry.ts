import type { CurrencyCode } from './types'
import { getCurrencySymbol } from './format'
import { resolveCurrencyDisplaySymbol } from './currencySymbolMap'

export type CurrencyMeta = {
  code: CurrencyCode
  symbol: string
}

/**
 * Symbol: {@link getCurrencySymbol}, then {@link resolveCurrencyDisplaySymbol} fallback
 * (same map as cron) when that yields only the ISO code — keeps picker aligned with price formatting.
 */
export function getCurrencyMeta(code: CurrencyCode): CurrencyMeta {
  const c = typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : 'EUR'
  let symbol = getCurrencySymbol(c)
  if (!symbol || symbol === c) {
    const fb = resolveCurrencyDisplaySymbol(c, undefined)
    if (fb) symbol = fb
  }
  return { code: c, symbol }
}

