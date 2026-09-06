"use client"

import * as React from 'react'
import { Icon } from '@iconify/react'
import { useLocale, useTranslations } from 'next-intl'
import { useCurrency } from '@/contexts/CurrencyContext'
import { cn } from '@/lib/utils'
import { getCurrencyMeta } from '@/lib/currency/registry'
import {
  headerSwitcherCaretClass,
  headerSwitcherPillClass,
} from './headerSwitcherStyles'

type CurrencySwitcherProps = {
  /** Header is floating over a photo hero. */
  overHero?: boolean
  /** Header has gained its own background on scroll. */
  sticky?: boolean
}

export default function CurrencySwitcher({
  overHero = false,
  sticky = false,
}: CurrencySwitcherProps) {
  const t = useTranslations('Currency')
  const locale = useLocale()
  const { currency, setCurrency, displayCurrencies } = useCurrency()
  const meta = getCurrencyMeta(currency, locale)
  const currencies = displayCurrencies.length > 0 ? displayCurrencies : ['EUR']
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const handleSelect = (newCurrency: string) => {
    setCurrency(newCurrency as never)
    setOpen(false)
    // Persist currency in URL so links can be shared with a specific currency
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.set('currency', newCurrency)
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    }
  }

  return (
    <div ref={ref} className="relative flex items-center min-w-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={headerSwitcherPillClass(overHero, sticky)}
        aria-label={t('switchTo', { currency })}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="inline-flex items-center gap-1 min-w-0">
          {meta.symbol !== meta.code ? (
            <>
              <span className="shrink-0">{meta.symbol}</span>
              {/* The logo and the menu button both need the room on a phone,
                  and the symbol alone already says which currency this is. */}
              <span className="hidden truncate sm:inline">{meta.code}</span>
            </>
          ) : (
            <span className="truncate">{meta.code}</span>
          )}
        </span>
        <Icon
          icon="ph:caret-down"
          width={14}
          height={14}
          className={headerSwitcherCaretClass(overHero, sticky, open)}
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
            {currencies.map((code) => {
              const c = getCurrencyMeta(code, locale)
              const showSymbol = c.symbol !== c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  role="option"
                  aria-selected={c.code === currency}
                  aria-label={t('switchTo', { currency: c.code })}
                  onClick={() => handleSelect(c.code)}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-1.5 text-sm cursor-pointer outline-none',
                    'text-dark dark:text-white',
                    'hover:bg-primary/15 dark:hover:bg-primary/25 hover:text-primary',
                    c.code === currency && 'text-primary bg-primary/10 dark:bg-primary/25'
                  )}
                >
                  {showSymbol ? (
                    <>
                      <span className="w-4 text-center shrink-0">{c.symbol}</span>
                      <span className="font-semibold">{c.code}</span>
                    </>
                  ) : (
                    <span className="font-semibold">{c.code}</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
