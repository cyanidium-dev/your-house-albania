'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId } from 'react'
import { Icon } from '@/components/shared/Icon'
import { PRIMARY_NAV_ITEMS, type BuyMenuData } from '@/data/navConfig'
import { isPrimaryNavItemActive, resolveNavHref } from './navActive'

export type DrawerNavTranslations = {
  nav: Record<string, string>
}

type DrawerNavListProps = {
  locale: string
  buyMenu: BuyMenuData
  translations: DrawerNavTranslations
  onNavigate: () => void
  pricesOpen: boolean
  onPricesOpenChange: (open: boolean) => void
}

const ROW_MIN = 'min-h-11'

const linkBase = clsx(
  'py-1.5 text-xl font-medium leading-snug text-white/40 transition-colors sm:text-3xl',
  'rounded-lg group-hover:text-primary',
)

const activeLink = '!text-primary text-primary'

function activeBar(active: boolean) {
  return clsx(
    'h-0.5 max-w-6 bg-primary transition-all duration-300',
    active ? 'w-6' : 'w-0 group-hover:w-6',
  )
}

const childLinkClass =
  'flex min-h-10 min-w-0 items-center truncate py-1 text-base font-medium leading-snug sm:text-2xl'

function stripQuery(path: string): string {
  const i = path.indexOf('?')
  return i >= 0 ? path.slice(0, i) : path
}

function isUnder(pathname: string, base: string): boolean {
  const p = stripQuery(pathname).replace(/\/$/, '') || '/'
  const b = stripQuery(base).replace(/\/$/, '') || '/'
  return p === b || p.startsWith(`${b}/`)
}

/**
 * The drawer below `lg`: the same five entries as the desktop bar. "Buy"
 * shows its cities open, always, because that is the one list a visitor on a
 * phone came for; the price pages fold under their own row.
 */
function DrawerNavList({
  locale,
  buyMenu,
  translations,
  onNavigate,
  pricesOpen,
  onPricesOpenChange,
}: DrawerNavListProps) {
  const path = usePathname()
  const pricesPanelId = useId()
  const nav = translations.nav

  const onPricePage = buyMenu.priceCities.some((c) => isUnder(path, c.href))

  return (
    <ul className="w-full">
      {PRIMARY_NAV_ITEMS.map((item) => {
        const active = isPrimaryNavItemActive(item, path, locale)

        if (item.kind === 'link') {
          const href = resolveNavHref(item.href, locale)
          return (
            <li key={item.key} className={`group flex w-full ${ROW_MIN} items-center gap-2`}>
              <div className={clsx('flex w-6 shrink-0 flex-col items-center justify-center self-stretch', ROW_MIN)}>
                <div className={activeBar(active)} />
              </div>
              <Link
                href={href}
                className={clsx(linkBase, active && activeLink, 'min-w-0 flex-1 truncate')}
                onClick={onNavigate}
              >
                {nav[item.key] ?? item.key}
              </Link>
            </li>
          )
        }

        return (
          <li key={item.key} className="group w-full max-w-full">
            <div className={clsx('flex w-full max-w-full items-stretch gap-2', ROW_MIN, 'sm:min-h-12')}>
              <div
                className={clsx(
                  'flex w-6 shrink-0 flex-col items-center justify-center self-stretch',
                  ROW_MIN,
                  'sm:min-h-12',
                )}
              >
                <div className={activeBar(active && !onPricePage)} />
              </div>
              <Link
                href={buyMenu.allListingsHref}
                className={clsx(
                  linkBase,
                  active && !onPricePage && activeLink,
                  'flex min-h-0 min-w-0 flex-1 items-center truncate',
                )}
                onClick={onNavigate}
              >
                {nav.buy}
              </Link>
            </div>

            <ul className="mt-1.5 border-l border-white/15 pl-4">
              {buyMenu.cities.map((c) => {
                const childActive = isUnder(path, c.href)
                return (
                  <li key={c.key}>
                    <Link
                      href={c.href}
                      className={clsx(childLinkClass, childActive ? 'text-primary' : 'text-white/40 hover:text-primary')}
                      onClick={onNavigate}
                    >
                      {c.label}
                    </Link>
                  </li>
                )
              })}
              <li>
                <Link
                  href={buyMenu.allCitiesHref}
                  className={clsx(
                    childLinkClass,
                    isUnder(path, buyMenu.allCitiesHref) ? 'text-primary' : 'text-white/40 hover:text-primary',
                  )}
                  onClick={onNavigate}
                >
                  {nav.allCities}
                </Link>
              </li>
            </ul>

            {buyMenu.priceCities.length > 0 ? (
              <div className="mt-2 border-l border-white/15 pl-4">
                <button
                  type="button"
                  className={clsx(
                    childLinkClass,
                    'w-full cursor-pointer justify-between gap-3 text-left touch-manipulation',
                    'focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/50',
                    onPricePage ? 'text-primary' : 'text-white/40 hover:text-primary',
                  )}
                  aria-expanded={pricesOpen}
                  aria-controls={pricesPanelId}
                  aria-label={pricesOpen ? nav.collapsePrices : nav.expandPrices}
                  onClick={() => onPricesOpenChange(!pricesOpen)}
                >
                  <span className="truncate">{nav.prices}</span>
                  <Icon
                    icon="ph:caret-down"
                    width={20}
                    height={20}
                    className={clsx('shrink-0 transition-transform duration-200', pricesOpen && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                {pricesOpen ? (
                  <ul id={pricesPanelId} className="mt-0.5 border-l border-white/15 pl-4">
                    {buyMenu.priceCities.map((c) => {
                      const childActive = isUnder(path, c.href)
                      return (
                        <li key={c.key}>
                          <Link
                            href={c.href}
                            className={clsx(
                              childLinkClass,
                              childActive ? 'text-primary' : 'text-white/40 hover:text-primary',
                            )}
                            onClick={onNavigate}
                          >
                            {c.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export default DrawerNavList
