"use client"

import React from 'react'
import type { CurrencyCode, ExchangeRates } from '@/lib/currency/types'
import { getExchangeRates, DEFAULT_RATES } from '@/lib/currency/rates'
import { convertFromBaseEur, convertToBaseEur } from '@/lib/currency/convert'
import { formatMoney } from '@/lib/currency/format'

type CurrencyContextValue = {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  rates: ExchangeRates
  /** Convert base EUR amount to active currency (no formatting). */
  fromEur: (amountEur: number) => number
  /** Convert active currency amount to base EUR (no formatting). */
  toEur: (amount: number) => number
  /** Format base EUR amount as active currency. */
  formatFromEur: (amountEur: number) => string
}

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null)

const STORAGE_KEY = 'yh.currency.v1'

function readCurrencyFromUrl(): CurrencyCode | null {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get('currency')
  if (v === 'USD' || v === 'EUR') return v
  return null
}

function readCurrencyFromStorage(): CurrencyCode | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(STORAGE_KEY)
  if (v === 'USD' || v === 'EUR') return v
  return null
}

function writeCurrencyToStorage(c: CurrencyCode) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, c)
  } catch {
    // ignore
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = React.useState<CurrencyCode>('EUR')
  const [rates, setRates] = React.useState<ExchangeRates>(DEFAULT_RATES)

  React.useEffect(() => {
    const fromUrl = readCurrencyFromUrl()
    const fromStorage = readCurrencyFromStorage()
    const next = fromUrl ?? fromStorage ?? 'EUR'
    setCurrencyState(next)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    getExchangeRates().then((r) => {
      if (!cancelled) setRates(r)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const setCurrency = React.useCallback((c: CurrencyCode) => {
    setCurrencyState(c)
    writeCurrencyToStorage(c)

    // Optional: reflect in URL (?currency=USD) without navigation
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (c === 'EUR') url.searchParams.delete('currency')
      else url.searchParams.set('currency', c)
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const value = React.useMemo<CurrencyContextValue>(() => {
    return {
      currency,
      setCurrency,
      rates,
      fromEur: (amountEur) => convertFromBaseEur(amountEur, currency, rates),
      toEur: (amount) => convertToBaseEur(amount, currency, rates),
      formatFromEur: (amountEur) => formatMoney(convertFromBaseEur(amountEur, currency, rates), currency, typeof navigator !== 'undefined' ? navigator.language : 'en'),
    }
  }, [currency, rates, setCurrency])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext)
  if (!ctx) {
    // Safe fallback when provider isn't mounted (e.g. tests)
    const currency: CurrencyCode = 'EUR'
    const rates = DEFAULT_RATES
    return {
      currency,
      setCurrency: () => {},
      rates,
      fromEur: (amountEur: number) => convertFromBaseEur(amountEur, currency, rates),
      toEur: (amount: number) => convertToBaseEur(amount, currency, rates),
      formatFromEur: (amountEur: number) => formatMoney(amountEur, 'EUR', 'en'),
    } satisfies CurrencyContextValue
  }
  return ctx
}

