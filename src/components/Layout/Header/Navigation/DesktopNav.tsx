'use client'

import Link from "@/components/shared/Link";
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/shared/Icon'
import { PRIMARY_NAV_ITEMS, type BuyMenuData } from '@/data/navConfig'
import { cn } from '@/lib/utils'
import { isPrimaryNavItemActive, resolveNavHref } from './navActive'

type DesktopNavProps = {
  locale: string
  buyMenu: BuyMenuData
  nav: Record<string, string>
  /** Floating over a photo, before the bar has its own background. */
  onPhoto: boolean
  ariaLabel: string
}

const CLOSE_DELAY_MS = 160

/**
 * The bar's five entries at `lg` and up. "Buy" opens a two-column panel:
 * the cities with listings and the cities with a price page, so the visitor
 * goes Durrës or Tirana in one click instead of Buy → Cities → Durrës.
 *
 * Hover opens the panel with a short close delay so the pointer can travel
 * into it; click toggles it for touch and keyboard; Escape, an outside click
 * and a route change close it.
 */
export default function DesktopNav({ locale, buyMenu, nav, onPhoto, ariaLabel }: DesktopNavProps) {
  const pathname = usePathname()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])
  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }, [cancelClose])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  useEffect(() => cancelClose, [cancelClose])

  const linkClass = (active: boolean) =>
    cn(
      'relative inline-flex h-10 items-center whitespace-nowrap rounded-full px-3.5 text-[15px] font-medium transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      onPhoto
        ? cn('text-white/85 hover:bg-white/10 hover:text-white', active && 'text-white')
        : cn(
            'text-dark/75 hover:bg-dark/5 hover:text-dark dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white',
            active && 'text-dark dark:text-white',
          ),
    )

  const activeBar = (active: boolean) => (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-3.5 bottom-1 h-0.5 rounded-full bg-primary transition-opacity duration-200',
        active ? 'opacity-100' : 'opacity-0',
      )}
    />
  )

  const panelLink =
    'flex min-h-10 items-center rounded-xl px-3 py-2 text-[15px] font-medium text-dark/85 transition-colors hover:bg-dark/[0.05] hover:text-dark dark:text-white/85 dark:hover:bg-white/[0.07] dark:hover:text-white'
  const columnHeading =
    'px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-dark/45 dark:text-white/45'

  return (
    <nav aria-label={ariaLabel} className="hidden min-w-0 items-center gap-0.5 lg:flex">
      {PRIMARY_NAV_ITEMS.map((item) => {
        const active = isPrimaryNavItemActive(item, pathname, locale)
        if (item.kind === 'link') {
          return (
            <Link key={item.key} href={resolveNavHref(item.href, locale)} className={linkClass(active)}>
              {nav[item.key] ?? item.key}
              {activeBar(active)}
            </Link>
          )
        }
        return (
          <div
            key={item.key}
            ref={rootRef}
            className="relative"
            onMouseEnter={() => {
              cancelClose()
              setOpen(true)
            }}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              className={cn(linkClass(active || open), 'gap-1 pr-2.5')}
              aria-haspopup="true"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? nav.closeBuyMenu : nav.openBuyMenu}
              onClick={() => setOpen((v) => !v)}
            >
              {nav.buy}
              <Icon
                icon="ph:caret-down"
                width={16}
                height={16}
                className={cn('transition-transform duration-200', open && 'rotate-180')}
                aria-hidden
              />
              {activeBar(active)}
            </button>

            <div
              id={panelId}
              hidden={!open}
              className={cn(
                'absolute left-0 top-full z-50 mt-3 w-[38rem] max-w-[calc(100vw-2rem)] origin-top-left rounded-2xl border p-2',
                'border-dark/10 bg-white text-dark shadow-[0_28px_60px_-24px_rgba(23,32,35,0.45)]',
                'dark:border-white/10 dark:bg-[#1b2528] dark:text-white dark:shadow-[0_28px_60px_-20px_rgba(0,0,0,0.7)]',
              )}
            >
              <div className="grid grid-cols-2 gap-1 p-1">
                <div>
                  <p className={columnHeading}>{nav.buyCities}</p>
                  <ul>
                    {buyMenu.cities.map((c) => (
                      <li key={c.key}>
                        <Link href={c.href} className={panelLink} onClick={() => setOpen(false)}>
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={columnHeading}>{nav.buyPrices}</p>
                  <ul>
                    {buyMenu.priceCities.map((c) => (
                      <li key={c.key}>
                        <Link href={c.href} className={panelLink} onClick={() => setOpen(false)}>
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 border-t border-dark/10 px-1 pt-2 dark:border-white/10">
                <Link
                  href={buyMenu.allListingsHref}
                  className={cn(panelLink, 'gap-1.5 text-primary hover:text-primary dark:text-[#5fd3a9] dark:hover:text-[#5fd3a9]')}
                  onClick={() => setOpen(false)}
                >
                  {nav.allListings}
                  <Icon icon="ph:arrow-right" width={16} height={16} aria-hidden />
                </Link>
                <Link href={buyMenu.allCitiesHref} className={panelLink} onClick={() => setOpen(false)}>
                  {nav.allCities}
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
