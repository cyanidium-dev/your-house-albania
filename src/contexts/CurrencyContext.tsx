"use client"

import React from 'react'
import type { CurrencyCode, ExchangeRates } from '@/lib/currency/types'
import { convertFromBaseEur, convertToBaseEur } from '@/lib/currency/convert'
import { formatMoney } from '@/lib/currency/format'

type SanityCurrencyRate = { code?: string; rate?: number; symbol?: string }

type CurrencyContextValue = {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  rates: ExchangeRates
  displayCurrencies: string[]
  /** Convert base EUR amount to active currency (no formatting). */
  fromEur: (amountEur: number) => number
  /** Convert active currency amount to base EUR (no formatting). */
  toEur: (amount: number) => number
  /** Format base EUR amount as active currency. */
  formatFromEur: (amountEur: number) => string
}

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null)

const STORAGE_KEY = 'yh.currency.v1'

const FALLBACK_RATES: ExchangeRates = {
  base: 'EUR',
  rates: { EUR: 1 },
  fetchedAt: 0,
}

function buildExchangeRatesFromSanity(currencyRates: SanityCurrencyRate[]): ExchangeRates {
  const rates: Record<string, number> = { EUR: 1 }
  for (const r of currencyRates) {
    const code = typeof r?.code === 'string' ? r.code.trim().toUpperCase() : ''
    const rate = typeof r?.rate === 'number' && Number.isFinite(r.rate) ? r.rate : null
    if (code && rate !== null && rate > 0) {
      rates[code] = rate
    }
  }
  return { base: 'EUR', rates, fetchedAt: Date.now() }
}

/** Resolve selected currency from localStorage; validate against displayCurrencies. */
function resolveCurrency(
  displayCurrencies: string[],
  fromStorage: string | null
): CurrencyCode {
  const preferred = fromStorage ?? 'EUR'
  const normalized = preferred.trim().toUpperCase()
  if (displayCurrencies.length === 0) return 'EUR'
  const isValid = displayCurrencies.some((c) => c.trim().toUpperCase() === normalized)
  return isValid ? normalized : (displayCurrencies[0]?.trim().toUpperCase() ?? 'EUR')
}

export function CurrencyProvider({
  children,
  currencyRates = [],
  displayCurrencies = [],
}: {
  children: React.ReactNode
  currencyRates?: SanityCurrencyRate[]
  displayCurrencies?: string[]
}) {
  const rates = React.useMemo(
    () =>
      Array.isArray(currencyRates) && currencyRates.length > 0
        ? buildExchangeRatesFromSanity(currencyRates)
        : FALLBACK_RATES,
    [currencyRates]
  )

  const validCurrencies = React.useMemo(() => {
    const list = Array.isArray(displayCurrencies) ? displayCurrencies : []
    const filtered = list
      .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
      .map((c) => c.trim().toUpperCase())
    return filtered.length > 0 ? filtered : ['EUR']
  }, [displayCurrencies])

  const [currency, setCurrencyState] = React.useState<CurrencyCode>(() => validCurrencies[0] ?? 'EUR')

  const validCurrenciesKey = validCurrencies.join(',')
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const fromStorage = window.localStorage.getItem(STORAGE_KEY)?.trim().toUpperCase() ?? null
    const next = resolveCurrency(validCurrencies, fromStorage)
    setCurrencyState(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validCurrenciesKey captures list changes
  }, [validCurrenciesKey])

  const setCurrency = React.useCallback(
    (c: CurrencyCode) => {
      const normalized = (typeof c === 'string' ? c : '').trim().toUpperCase()
      if (!normalized) return
      const allowed = validCurrencies.includes(normalized) ? normalized : validCurrencies[0] ?? 'EUR'
      setCurrencyState(allowed)
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, allowed)
        } catch {
          // ignore
        }
      }
    },
    [validCurrencies]
  )

  const value = React.useMemo<CurrencyContextValue>(() => {
    return {
      currency,
      setCurrency,
      rates,
      displayCurrencies: validCurrencies,
      fromEur: (amountEur) => convertFromBaseEur(amountEur, currency, rates),
      toEur: (amount) => convertToBaseEur(amount, currency, rates),
      formatFromEur: (amountEur) =>
        formatMoney(
          convertFromBaseEur(amountEur, currency, rates),
          currency,
          typeof navigator !== 'undefined' ? navigator.language : 'en'
        ),
    }
  }, [currency, rates, setCurrency, validCurrencies])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext)
  if (!ctx) {
    // Safe fallback when provider isn't mounted (e.g. tests)
    const currency: CurrencyCode = 'EUR'
    const rates = FALLBACK_RATES
    return {
      currency,
      setCurrency: () => {},
      rates,
      displayCurrencies: ['EUR'],
      fromEur: (amountEur: number) => convertFromBaseEur(amountEur, currency, rates),
      toEur: (amount: number) => convertToBaseEur(amount, currency, rates),
      formatFromEur: (amountEur: number) => formatMoney(amountEur, 'EUR', 'en'),
    } satisfies CurrencyContextValue
  }
  return ctx
}

