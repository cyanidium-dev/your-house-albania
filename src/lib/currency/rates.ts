import type { ExchangeRates } from './types'

const STORAGE_KEY = 'yh.exchangeRates.v1'
const MAX_AGE_MS = 1000 * 60 * 60 * 6 // 6 hours

export const DEFAULT_RATES: ExchangeRates = {
  base: 'EUR',
  rates: {
    EUR: 1,
    // Temporary static rate; swap getExchangeRates() implementation to real API later.
    USD: 1.08,
  },
  fetchedAt: Date.now(),
}

function safeParse(json: string | null): ExchangeRates | null {
  if (!json) return null
  try {
    const obj = JSON.parse(json) as ExchangeRates
    if (!obj || obj.base !== 'EUR') return null
    if (!obj.rates || typeof obj.rates.EUR !== 'number' || typeof obj.rates.USD !== 'number') return null
    if (typeof obj.fetchedAt !== 'number') return null
    return obj
  } catch {
    return null
  }
}

export function readCachedRates(): ExchangeRates | null {
  if (typeof window === 'undefined') return null
  const cached = safeParse(window.localStorage.getItem(STORAGE_KEY))
  if (!cached) return null
  if (Date.now() - cached.fetchedAt > MAX_AGE_MS) return null
  return cached
}

export function writeCachedRates(rates: ExchangeRates) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rates))
  } catch {
    // ignore storage quota / privacy mode
  }
}

/**
 * Exchange rates provider (base EUR).
 * For now returns cached or DEFAULT_RATES. Replace with real API fetch later.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const cached = readCachedRates()
  if (cached) return cached
  const next: ExchangeRates = { ...DEFAULT_RATES, fetchedAt: Date.now() }
  writeCachedRates(next)
  return next
}

