/** Currency code string (e.g. EUR, USD). Supports any ISO 4217 code from Sanity displayCurrencies. */
export type CurrencyCode = string

export type ExchangeRates = {
  base: 'EUR'
  /** Conversion rates from base (EUR) to target. Example: rates.USD = 1.08 */
  rates: Record<string, number>
  /** Unix ms timestamp when rates were retrieved */
  fetchedAt: number
}

