"use client"

import * as React from 'react'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/contexts/CurrencyContext'
import { cn } from '@/lib/utils'
import { CURRENCIES, getCurrencyMeta } from '@/lib/currency/registry'

export default function CurrencySwitcher() {
  const t = useTranslations('Currency')
  const { currency, setCurrency } = useCurrency()
  const meta = getCurrencyMeta(currency)
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const handleSelect = (newCurrency: string) => {
    setCurrency(newCurrency as never)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative flex items-center min-w-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'relative inline-flex h-8 items-center justify-between gap-1.5 rounded-full',
          'bg-dark/5 dark:bg-white/10',
          'px-2.5 pr-8',
          'text-sm font-semibold text-dark/80 dark:text-white/80',
          'cursor-pointer transition-colors hover:bg-dark/10 dark:hover:bg-white/15',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset'
        )}
        aria-label={t('switchTo', { currency })}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="inline-flex items-center gap-1 min-w-0">
          <span className="shrink-0">{meta.symbol}</span>
          <span className="truncate">{meta.code}</span>
        </span>
        <Icon
          icon="ph:caret-down"
          width={14}
          height={14}
          className={cn(
            'absolute right-2.5 top-1/2 -translate-y-1/2 text-dark/60 dark:text-white/70 pointer-events-none transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-label={t('switchTo', { currency })}
            className={cn(
              'absolute right-0 top-full mt-2 py-1 z-50',
              'rounded-2xl border border-dark/10 dark:border-white/10 shadow-3xl',
              'bg-white dark:bg-dark',
              'min-w-[7rem]',
              'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2'
            )}
          >
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={c.code === currency}
                onClick={() => handleSelect(c.code)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-1.5 text-sm cursor-pointer outline-none',
                  'text-dark dark:text-white',
                  'hover:bg-primary/15 dark:hover:bg-primary/25 hover:text-primary',
                  c.code === currency && 'text-primary bg-primary/10 dark:bg-primary/25'
                )}
              >
                <span className="w-4 text-center">{c.symbol}</span>
                <span className="font-semibold">{c.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
