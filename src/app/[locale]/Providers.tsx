"use client"

import React from 'react'
import { CurrencyProvider } from '@/contexts/CurrencyContext'

type SanityCurrencyRate = { code?: string; rate?: number; symbol?: string }

type ProvidersProps = {
  children: React.ReactNode
  currencyRates?: unknown[]
  displayCurrencies?: string[]
}

export function Providers({ children, currencyRates = [], displayCurrencies = [] }: ProvidersProps) {
  const rates = Array.isArray(currencyRates) ? (currencyRates as SanityCurrencyRate[]) : []
  const currencies = Array.isArray(displayCurrencies)
    ? displayCurrencies.filter((c): c is string => typeof c === 'string' && c.trim() !== '')
    : []
  return (
    <CurrencyProvider currencyRates={rates} displayCurrencies={currencies}>
      {children}
    </CurrencyProvider>
  )
}

