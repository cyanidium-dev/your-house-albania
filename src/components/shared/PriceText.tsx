"use client"

import React from 'react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/contexts/CurrencyContext'
import { convertFromBaseEur } from '@/lib/currency/convert'
import { formatMoney } from '@/lib/currency/format'

export function PriceText({
  amountEur,
  priceUnit,
  locale,
  className,
}: {
  amountEur: number | null
  /** A per-m² rate is shown as a rate — the same words the card uses — never as if it were the total. */
  priceUnit?: 'total' | 'per-sqm'
  locale: string
  className?: string
}) {
  const { currency, rates } = useCurrency()
  const t = useTranslations('Shared.propertyCard')
  if (typeof amountEur !== 'number' || !Number.isFinite(amountEur)) return null
  // Zero is "the seller has not named a price", never a price of nothing.
  if (amountEur <= 0) return <span className={className}>{t('priceOnRequest')}</span>
  const converted = convertFromBaseEur(amountEur, currency, rates)
  const amount = formatMoney(converted, currency, locale)
  return (
    <span className={className}>{priceUnit === 'per-sqm' ? t('pricePerSqmFrom', { amount }) : amount}</span>
  )
}

