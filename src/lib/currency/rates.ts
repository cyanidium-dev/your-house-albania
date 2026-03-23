import type { ExchangeRates } from './types'

/**
 * Minimal fallback when Sanity currency data is unavailable.
 * Rates are now provided by CurrencyContext from Sanity siteSettings.
 */
export const FALLBACK_RATES: ExchangeRates = {
  base: 'EUR',
  rates: { EUR: 1 },
  fetchedAt: 0,
}

