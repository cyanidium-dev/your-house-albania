'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { Icon } from '@/components/shared/Icon'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getCurrencyMeta } from '@/lib/currency/registry'
import { cn } from '@/lib/utils'
import { persistCurrencyInUrl } from '../CurrencySwitcher'

/** Each language in its own name: a visitor looks for the one they read. */
const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
  sq: 'Shqip',
  it: 'Italiano',
  pl: 'Polski',
  de: 'Deutsch',
}

const fieldLabel = 'mb-1.5 block text-[12px] font-medium text-dark/55 dark:text-white/55'
const selectShell =
  'relative flex h-12 items-center rounded-xl bg-dark/[0.05] text-[15px] font-medium transition-colors focus-within:ring-2 focus-within:ring-primary/50 hover:bg-dark/[0.08] dark:bg-white/[0.07] dark:hover:bg-white/[0.1]'
const selectEl =
  'h-full w-full min-w-0 cursor-pointer appearance-none truncate rounded-xl bg-transparent pl-3 pr-8 text-dark outline-none dark:text-white [&>option]:text-dark'

/**
 * Language, currency and theme in one row at the foot of the drawer. Native
 * selects: on a phone they open the system picker, which is larger and
 * clearer than any dropdown we could draw inside a scrolling sheet.
 */
export default function DrawerSettings() {
  const t = useTranslations('Header.drawer')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { currency, setCurrency, displayCurrencies } = useCurrency()
  const currencies = displayCurrencies.length > 0 ? displayCurrencies : ['EUR']
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  const onLocale = (next: string) => {
    if (next === locale) return
    // Same rule as the header switcher: keep the query (catalogue filters).
    const search = typeof window !== 'undefined' ? window.location.search : ''
    router.replace(`${pathname}${search}`, { locale: next })
  }

  const onCurrency = (next: string) => {
    setCurrency(next as never)
    persistCurrencyInUrl(next)
  }

  const segment = (active: boolean) =>
    cn(
      'flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      active
        ? 'bg-white text-dark shadow-sm dark:bg-white/15 dark:text-white'
        : 'text-dark/55 hover:text-dark dark:text-white/55 dark:hover:text-white',
    )

  return (
    <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] items-end gap-2">
      <label className="min-w-0">
        <span className={fieldLabel}>{t('language')}</span>
        <span className={selectShell}>
          <select className={selectEl} value={locale} onChange={(e) => onLocale(e.target.value)}>
            {routing.locales.map((loc) => (
              <option key={loc} value={loc} lang={loc}>
                {LOCALE_NAMES[loc] ?? loc.toUpperCase()}
              </option>
            ))}
          </select>
          <Icon icon="ph:caret-down" width={16} height={16} aria-hidden className="pointer-events-none absolute right-3 text-dark/50 dark:text-white/60" />
        </span>
      </label>
      <label className="min-w-0">
        <span className={fieldLabel}>{t('currency')}</span>
        <span className={selectShell}>
          <select className={selectEl} value={currency} onChange={(e) => onCurrency(e.target.value)}>
            {currencies.map((code) => {
              const meta = getCurrencyMeta(code, locale)
              return (
                <option key={code} value={code}>
                  {meta.symbol !== meta.code ? `${meta.symbol} ${meta.code}` : meta.code}
                </option>
              )
            })}
          </select>
          <Icon icon="ph:caret-down" width={16} height={16} aria-hidden className="pointer-events-none absolute right-3 text-dark/50 dark:text-white/60" />
        </span>
      </label>
      <div role="group" aria-labelledby="drawer-theme-label">
        <span id="drawer-theme-label" className={fieldLabel}>
          {t('theme')}
        </span>
        <div className="flex h-12 items-center gap-0.5 rounded-xl bg-dark/[0.05] p-0.5 dark:bg-white/[0.07]">
          <button
            type="button"
            className={segment(mounted && !isDark)}
            aria-pressed={mounted && !isDark}
            aria-label={t('themeLight')}
            onClick={() => setTheme('light')}
          >
            <Icon icon="ph:sun" width={20} height={20} aria-hidden />
          </button>
          <button
            type="button"
            className={segment(isDark)}
            aria-pressed={isDark}
            aria-label={t('themeDark')}
            onClick={() => setTheme('dark')}
          >
            <Icon icon="ph:moon" width={20} height={20} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
