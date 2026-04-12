'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useId, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import type { DrawerNavItem } from '@/data/navConfig'
import type { FooterCityNavItem } from '@/lib/sanity/client'
import { catalogFilterPath, nonGeoDealListingPath } from '@/lib/routes/catalog'
import { deriveFooterCountrySlugFromPathname } from '@/lib/routes/footerCountry'

export type DrawerNavTranslations = {
  nav: Record<string, string>
}

type DrawerNavListProps = {
  items: DrawerNavItem[]
  countrySlugs: readonly string[]
  translations: DrawerNavTranslations
  onNavigate: () => void
  citiesOpen: boolean
  onCitiesOpenChange: (open: boolean) => void
  realtorsOpen: boolean
  onRealtorsOpenChange: (open: boolean) => void
}

function resolvedHref(href: string, locale: string): string {
  if (href === '/') return `/${locale}`
  return `/${locale}${href}`
}

function stripQuery(path: string): string {
  const i = path.indexOf('?')
  return i >= 0 ? path.slice(0, i) : path
}

/** True when pathname is the listing base or a deeper segment (deal/type/…) for the same city. */
function isPathUnderListingBase(pathname: string, baseHref: string): boolean {
  const p = stripQuery(pathname).replace(/\/$/, '') || '/'
  const b = stripQuery(baseHref).replace(/\/$/, '') || '/'
  if (p === b) return true
  return p.startsWith(`${b}/`)
}

function drawerCityCatalogHref(locale: string, city: FooterCityNavItem): string {
  return catalogFilterPath({
    locale,
    city: city.slug,
    trustedCityCountrySlug: city.countrySlug,
    country: city.countrySlug,
  })
}

const ROW_MIN = 'min-h-11'

const linkBase = clsx(
  'py-1.5 text-xl font-medium leading-snug text-white/40 transition-colors sm:text-3xl',
  'rounded-lg group-hover:text-primary',
)

const expandToggleClass = clsx(
  'w-[35%] max-w-[120px] min-w-[80px] shrink-0 touch-manipulation',
  'flex flex-col items-end justify-center rounded-xl text-white/50 transition',
  'cursor-pointer',
  'focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/50',
)

const activeLink = '!text-primary text-primary'

function activeBar(active: boolean) {
  return clsx(
    'h-0.5 max-w-6 bg-primary transition-all duration-300',
    active ? 'w-6' : 'w-0 group-hover:w-6',
  )
}

function DrawerNavList({
  items,
  countrySlugs,
  translations,
  onNavigate,
  citiesOpen,
  onCitiesOpenChange,
  realtorsOpen,
  onRealtorsOpenChange,
}: DrawerNavListProps) {
  const path = usePathname()
  const locale = useLocale()
  const citiesPanelId = useId()
  const realtorsPanelId = useId()

  const [cityItems, setCityItems] = useState<FooterCityNavItem[]>([])

  const activeCountry = useMemo(
    () => deriveFooterCountrySlugFromPathname(path, locale, countrySlugs),
    [path, locale, countrySlugs],
  )

  useEffect(() => {
    let cancelled = false
    fetch(
      `/api/footer-cities?locale=${encodeURIComponent(locale)}&country=${encodeURIComponent(activeCountry)}`,
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data: FooterCityNavItem[]) => {
        if (!cancelled && Array.isArray(data)) setCityItems(data)
      })
      .catch(() => {
        if (!cancelled) setCityItems([])
      })
    return () => {
      cancelled = true
    }
  }, [locale, activeCountry])

  useEffect(() => {
    const citiesBase = `/${locale}/cities`
    const onCitiesHub = path === citiesBase || path.startsWith(`${citiesBase}/`)
    const onCityListing =
      cityItems.length > 0 &&
      cityItems.some((c) => isPathUnderListingBase(path, drawerCityCatalogHref(locale, c)))
    if (onCitiesHub || onCityListing) onCitiesOpenChange(true)
  }, [path, locale, cityItems, onCitiesOpenChange])

  useEffect(() => {
    const realtorsBase = `/${locale}/for-realtors`
    const howToBase = `/${locale}/how-to-publish`
    const registerBase = `/${locale}/register`
    if (
      path === realtorsBase ||
      path.startsWith(`${realtorsBase}/`) ||
      path === howToBase ||
      path.startsWith(`${howToBase}/`) ||
      path === registerBase ||
      path.startsWith(`${registerBase}/`)
    ) {
      onRealtorsOpenChange(true)
    }
  }, [path, locale, onRealtorsOpenChange])

  const isHomeActive = path === `/${locale}` || path === `/${locale}/`

  /** Non-geo deal category routes: `/{locale}/{sale|rent|short-term-rent}/…` */
  const isNonGeoDealCategoryActive = (dealRouteSegment: string) => {
    const base = nonGeoDealListingPath(locale, dealRouteSegment)
    const p = stripQuery(path).replace(/\/$/, '') || '/'
    const b = base.replace(/\/$/, '') || '/'
    return p === b || p.startsWith(`${b}/`)
  }

  const isCitiesParentActive =
    path === `/${locale}/cities` ||
    path.startsWith(`/${locale}/cities/`) ||
    (cityItems.length > 0 &&
      cityItems.some((c) => isPathUnderListingBase(path, drawerCityCatalogHref(locale, c))))

  const isBlogActive =
    path === `/${locale}/blog` || path.startsWith(`/${locale}/blog/`)

  const isContactsActive =
    path === `/${locale}/contacts` || path === `/${locale}/contactus`

  const childLinkClass =
    'flex min-h-10 min-w-0 items-center truncate py-1 text-base font-medium leading-snug sm:text-2xl'

  return (
    <ul className="w-full">
      {items.map((item) => {
        if (item.kind === 'link') {
          const href = resolvedHref(item.href, locale)
          let active = false
          if (item.key === 'home') active = isHomeActive
          else if (item.key === 'buy') active = isNonGeoDealCategoryActive('sale')
          else if (item.key === 'rent') active = isNonGeoDealCategoryActive('rent')
          else if (item.key === 'shortTermRent') active = isNonGeoDealCategoryActive('short-term-rent')
          else if (item.key === 'blog') active = isBlogActive
          else if (item.key === 'contacts') active = isContactsActive
          else active = path === href || path.startsWith(`${href}/`)

          const label = translations.nav[item.key] ?? item.key

          return (
            <li key={item.key} className={`group flex w-full ${ROW_MIN} items-center gap-2`}>
              <div
                className={clsx(
                  'flex w-6 shrink-0 flex-col items-center justify-center self-stretch',
                  ROW_MIN,
                )}
              >
                <div className={activeBar(active)} />
              </div>
              <Link
                href={href}
                className={clsx(linkBase, active && activeLink, 'min-w-0 flex-1 truncate')}
                onClick={onNavigate}
              >
                {label}
              </Link>
            </li>
          )
        }

        if (item.kind === 'expandable') {
          const parentHref = resolvedHref(item.href, locale)
          const parentLabel = translations.nav[item.key] ?? item.key

          if (item.key === 'cities') {
            const expandLabel = translations.nav.expandCities ?? 'Expand cities'
            const collapseLabel = translations.nav.collapseCities ?? 'Collapse cities'

            return (
              <li key={item.key} className="group w-full max-w-full">
                <div
                  className={clsx(
                    'flex w-full max-w-full items-stretch gap-2',
                    ROW_MIN,
                    'sm:min-h-12',
                  )}
                >
                  <div
                    className={clsx(
                      'flex w-6 shrink-0 flex-col items-center justify-center self-stretch',
                      ROW_MIN,
                      'sm:min-h-12',
                    )}
                  >
                    <div className={activeBar(isCitiesParentActive)} />
                  </div>
                  <Link
                    href={parentHref}
                    className={clsx(
                      linkBase,
                      isCitiesParentActive && activeLink,
                      'flex min-h-0 min-w-0 flex-1 items-center truncate',
                    )}
                    onClick={onNavigate}
                  >
                    {parentLabel}
                  </Link>
                  <button
                    type="button"
                    className={clsx(
                      expandToggleClass,
                      ROW_MIN,
                      'sm:min-h-12',
                    )}
                    aria-expanded={citiesOpen}
                    aria-controls={citiesPanelId}
                    aria-label={citiesOpen ? collapseLabel : expandLabel}
                    onClick={(e) => {
                      e.preventDefault()
                      onCitiesOpenChange(!citiesOpen)
                    }}
                  >
                    <Icon
                      icon="ph:caret-down"
                      width={22}
                      height={22}
                      className={clsx(
                        'transition-transform duration-200',
                        citiesOpen && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </button>
                </div>
                {citiesOpen ? (
                  <ul
                    id={citiesPanelId}
                    className="mt-1.5 space-y-0 border-l border-white/15 pl-4"
                  >
                    {cityItems.map((c) => {
                      const ch = drawerCityCatalogHref(locale, c)
                      const childActive = isPathUnderListingBase(path, ch)
                      return (
                        <li key={`${c.slug}-${c.countrySlug ?? ''}`}>
                          <Link
                            href={ch}
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
              </li>
            )
          }

          if (item.key === 'realtors') {
            const howToHref = resolvedHref('/how-to-publish', locale)
            const registerHref = resolvedHref('/register', locale)
            const isHowToActive = path === howToHref || path.startsWith(`${howToHref}/`)
            const isRegisterActive =
              path === registerHref || path.startsWith(`${registerHref}/`)
            const isRealtorsParentActive =
              path === parentHref ||
              path.startsWith(`${parentHref}/`) ||
              isHowToActive ||
              isRegisterActive
            const expandLabel = translations.nav.expandRealtors ?? 'Expand For realtors section'
            const collapseLabel =
              translations.nav.collapseRealtors ?? 'Collapse For realtors section'
            const realtorChildKeys = ['realtorsAbout', 'realtorsRegister'] as const

            return (
              <li key={item.key} className="group w-full max-w-full">
                <div
                  className={clsx(
                    'flex w-full max-w-full items-stretch gap-2',
                    ROW_MIN,
                    'sm:min-h-12',
                  )}
                >
                  <div
                    className={clsx(
                      'flex w-6 shrink-0 flex-col items-center justify-center self-stretch',
                      ROW_MIN,
                      'sm:min-h-12',
                    )}
                  >
                    <div className={activeBar(isRealtorsParentActive)} />
                  </div>
                  <Link
                    href={parentHref}
                    className={clsx(
                      linkBase,
                      isRealtorsParentActive && activeLink,
                      'flex min-h-0 min-w-0 flex-1 items-center truncate',
                    )}
                    onClick={onNavigate}
                  >
                    {parentLabel}
                  </Link>
                  <button
                    type="button"
                    className={clsx(
                      expandToggleClass,
                      ROW_MIN,
                      'sm:min-h-12',
                    )}
                    aria-expanded={realtorsOpen}
                    aria-controls={realtorsPanelId}
                    aria-label={realtorsOpen ? collapseLabel : expandLabel}
                    onClick={(e) => {
                      e.preventDefault()
                      onRealtorsOpenChange(!realtorsOpen)
                    }}
                  >
                    <Icon
                      icon="ph:caret-down"
                      width={22}
                      height={22}
                      className={clsx(
                        'transition-transform duration-200',
                        realtorsOpen && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </button>
                </div>
                {realtorsOpen ? (
                  <ul
                    id={realtorsPanelId}
                    className="mt-1.5 space-y-0 border-l border-white/15 pl-4"
                    role="list"
                  >
                    {realtorChildKeys.map((childKey) =>
                      childKey === 'realtorsAbout' ? (
                        <li key={childKey}>
                          <Link
                            href={howToHref}
                            className={clsx(
                              childLinkClass,
                              isHowToActive
                                ? 'text-primary'
                                : 'text-white/40 hover:text-primary',
                            )}
                            onClick={onNavigate}
                          >
                            {translations.nav[childKey] ?? childKey}
                          </Link>
                        </li>
                      ) : (
                        <li key={childKey}>
                          <Link
                            href={registerHref}
                            className={clsx(
                              childLinkClass,
                              isRegisterActive
                                ? 'text-primary'
                                : 'text-white/40 hover:text-primary',
                            )}
                            onClick={onNavigate}
                          >
                            {translations.nav[childKey] ?? childKey}
                          </Link>
                        </li>
                      ),
                    )}
                  </ul>
                ) : null}
              </li>
            )
          }

          return null
        }

        return null
      })}
    </ul>
  )
}

export default DrawerNavList
