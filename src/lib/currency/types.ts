export type CurrencyCode = 'EUR' | 'USD'

export type ExchangeRates = {
  base: 'EUR'
  /** Conversion rates from base (EUR) to target. Example: rates.USD = 1.08 */
  rates: Record<CurrencyCode, number>
  /** Unix ms timestamp when rates were retrieved */
  fetchedAt: number
}

