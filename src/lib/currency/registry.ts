import type { CurrencyCode } from './types'

export type CurrencyMeta = {
  code: CurrencyCode
  symbol: string
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
]

export function getCurrencyMeta(code: CurrencyCode): CurrencyMeta {
  return CURRENCIES.find((c) => c.code === code) ?? { code, symbol: code === 'USD' ? '$' : '€' }
}

