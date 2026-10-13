'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getCurrencyMeta } from '@/lib/currency/registry'
import { cn } from '@/lib/utils'
import { writeCurrencyToUrl } from './CurrencySwitcher'

/**
 * Currency and theme inside the phone menu.
 *
 * Below `md` the header bar keeps only the language, the assistant, favourites
 * and the menu button; with the currency and theme pills next to them the
 * logo was squeezed to 66px on a 375px phone (audit 2026-10-13). Both are set
 * once rather than on every visit, so the menu is where they belong there.
 *
 * The drawer is dark in both themes, so the chips are drawn for a dark ground
 * here rather than borrowing the page-themed segmented control.
 */
const TRACK = 'flex items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/10'

function chipClass(active: boolean) {
  return cn(
    'inline-flex h-8 min-w-0 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors duration-200 ease-out cursor-pointer',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60',
    active ? 'bg-white text-dark' : 'text-white/75 hover:bg-white/10 hover:text-white',
  )
}

export default function DrawerSettings() {
  const t = useTranslations('Header.settings')
  const locale = useLocale()
  const { currency, setCurrency, displayCurrencies } = useCurrency()
  const currencies = displayCurrencies.length > 0 ? displayCurrencies : ['EUR']
  const { resolvedTheme, setTheme } = useTheme()
  // The server cannot know the stored theme; mark neither chip until mounted
  // so the first client render matches the server's.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const theme = mounted ? resolvedTheme : undefined

  return (
    <div className="grid w-full gap-3 md:hidden">
      {/* The label sits above the currencies: five codes and a label do not
          fit one 311px row, and a wrapped pill track reads as two controls. */}
      <div className="grid gap-1.5">
        <span className="text-sm font-medium text-white/55">{t('currency')}</span>
        <div className={TRACK} role="radiogroup" aria-label={t('currency')}>
          {currencies.map((code) => {
            const meta = getCurrencyMeta(code, locale)
            const active = meta.code === currency
            return (
              <button
                key={meta.code}
                type="button"
                role="radio"
                aria-checked={active}
                className={cn(chipClass(active), 'flex-1')}
                onClick={() => {
                  setCurrency(meta.code as never)
                  writeCurrencyToUrl(meta.code)
                }}
              >
                {meta.code}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white/55">{t('theme')}</span>
        <div className={TRACK} role="radiogroup" aria-label={t('theme')}>
          {(['light', 'dark'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              className={chipClass(theme === value)}
              onClick={() => setTheme(value)}
            >
              {t(value)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
