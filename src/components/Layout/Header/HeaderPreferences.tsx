'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getCurrencyMeta } from '@/lib/currency/registry'
import { persistCurrencyInUrl } from '@/lib/currency/persistCurrencyInUrl'
import { localeName } from '@/lib/i18n/localeNames'
import { cn } from '@/lib/utils'
import { headerSwitcherButtonClass, headerSwitcherCaretClass, headerSwitcherPillClass } from './headerSwitcherStyles'

type Props = {
  /** Header is floating over a photo hero. */
  overHero?: boolean
  /** Header has gained its own background on scroll. */
  sticky?: boolean
}

const groupLabel = 'mb-2 block text-[11px] font-semibold uppercase tracking-wide text-dark/50 dark:text-white/50'

/**
 * Language, currency and theme behind one pill ("🌐 EN · €"): three controls
 * used to sit side by side in the bar, and on a phone two of them had to hide
 * in the drawer. One button, one popover with three groups (owner, 2026-10-19).
 *
 * Language changes keep the query (catalogue filters) and go through the
 * router, as the old switcher did; the currency is also written to the URL so
 * a shared link opens in it; the theme is next-themes. The theme is read only
 * after mount so the first client render matches the server's.
 */
export default function HeaderPreferences({ overHero = false, sticky = false }: Props) {
  const t = useTranslations('Header.drawer')
  const tHeader = useTranslations('Header')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { currency, setCurrency, displayCurrencies } = useCurrency()
  const currencies = displayCurrencies.length > 0 ? displayCurrencies : ['EUR']
  const meta = getCurrencyMeta(currency)
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (e.target instanceof Node && !rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const onLocale = (next: string) => {
    setOpen(false)
    if (next === locale) return
    const search = typeof window !== 'undefined' ? window.location.search : ''
    router.replace(`${pathname}${search}`, { locale: next })
  }

  const onCurrency = (next: string) => {
    setCurrency(next as never)
    persistCurrencyInUrl(next)
  }

  const onPhoto = overHero && !sticky
  const option = (active: boolean) =>
    cn(
      'flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      active
        ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/25'
        : 'text-dark hover:bg-dark/[0.05] dark:text-white dark:hover:bg-white/[0.08]',
    )
  const segment = (active: boolean) =>
    cn(
      'flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      active
        ? 'bg-white text-dark shadow-sm dark:bg-white/15 dark:text-white'
        : 'text-dark/55 hover:text-dark dark:text-white/55 dark:hover:text-white',
    )

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={headerSwitcherButtonClass()}
        aria-label={`${t('settings')}: ${localeName(locale)}, ${currency}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
      >
        <span className={cn(headerSwitcherPillClass(overHero, sticky), 'pl-2')}>
          <Icon
            icon="ph:globe-simple"
            width={16}
            height={16}
            aria-hidden
            className={cn('shrink-0', onPhoto ? 'text-white/90' : 'text-dark/60 dark:text-white/70')}
          />
          <span className="inline-flex items-center gap-1">
            <span>{locale.toUpperCase()}</span>
            <span aria-hidden className={onPhoto ? 'text-white/60' : 'text-dark/35 dark:text-white/40'}>
              ·
            </span>
            <span>{meta.symbol !== meta.code ? meta.symbol : meta.code}</span>
          </span>
          <Icon icon="ph:caret-down" width={14} height={14} className={headerSwitcherCaretClass(overHero, sticky, open)} />
        </span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div
            id={panelId}
            role="dialog"
            aria-label={t('settings')}
            // On a phone the pill sits mid-bar, so a panel hung off its right
            // edge ran 80px past the left of the screen: there it spans the
            // bar's own width instead, under the bar.
            className={cn(
              'z-50 p-3',
              'max-sm:fixed max-sm:inset-x-4 max-sm:top-[calc(env(safe-area-inset-top,0px)+60px)]',
              'sm:absolute sm:right-0 sm:top-full sm:mt-1 sm:w-[19rem]',
              'rounded-2xl border border-dark/10 bg-white shadow-3xl dark:border-white/10 dark:bg-dark',
              'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
            )}
          >
            <div>
              <span className={groupLabel}>{t('language')}</span>
              <ul className="grid grid-cols-2 gap-0.5" role="listbox" aria-label={tHeader('selectLanguage')}>
                {routing.locales.map((loc) => (
                  <li key={loc}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={loc === locale}
                      lang={loc}
                      onClick={() => onLocale(loc)}
                      className={cn(option(loc === locale), 'w-full')}
                    >
                      <span className="w-7 shrink-0 text-xs font-semibold uppercase text-dark/45 dark:text-white/45">{loc}</span>
                      <span className="truncate">{localeName(loc)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3">
              <span className={groupLabel}>{t('currency')}</span>
              <div className="flex flex-wrap gap-1" role="listbox" aria-label={t('currency')}>
                {currencies.map((code) => {
                  const c = getCurrencyMeta(code)
                  return (
                    <button
                      key={code}
                      type="button"
                      role="option"
                      aria-selected={code === currency}
                      onClick={() => onCurrency(code)}
                      className={cn(option(code === currency), 'min-w-[4.5rem] justify-center')}
                    >
                      {c.symbol !== c.code ? <span className="text-dark/60 dark:text-white/60">{c.symbol}</span> : null}
                      <span>{c.code}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-3">
              <span className={groupLabel}>{t('theme')}</span>
              <div className="flex gap-0.5 rounded-xl bg-dark/[0.05] p-0.5 dark:bg-white/[0.07]" role="group" aria-label={t('theme')}>
                <button type="button" className={segment(mounted && !isDark)} aria-pressed={mounted && !isDark} onClick={() => setTheme('light')}>
                  <Icon icon="ph:sun" width={18} height={18} aria-hidden />
                  {t('themeLight')}
                </button>
                <button type="button" className={segment(isDark)} aria-pressed={isDark} onClick={() => setTheme('dark')}>
                  <Icon icon="ph:moon" width={18} height={18} aria-hidden />
                  {t('themeDark')}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
