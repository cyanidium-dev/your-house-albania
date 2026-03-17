"use client"

import React from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { convertFromBaseEur } from '@/lib/currency/convert'
import { formatMoney } from '@/lib/currency/format'

export function PriceText({
  amountEur,
  locale,
  className,
}: {
  amountEur: number | null
  locale: string
  className?: string
}) {
  const { currency, rates } = useCurrency()
  if (typeof amountEur !== 'number' || !Number.isFinite(amountEur)) return null
  const converted = convertFromBaseEur(amountEur, currency, rates)
  return <span className={className}>{formatMoney(converted, currency, locale)}</span>
}

