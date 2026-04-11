'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useId, useState } from 'react'
import { Icon } from '@iconify/react'
import type { DrawerNavItem } from '@/data/navConfig'
import type { CityLandingNavItem } from '@/lib/sanity/client'
import { cityInfoPath } from '@/lib/routes/catalog'

export type DrawerNavTranslations = {
  nav: Record<string, string>
}

type DrawerNavListProps = {
  items: DrawerNavItem[]
  cityItems: CityLandingNavItem[]
  translations: DrawerNavTranslations
  onNavigate: () => void
}

function resolvedHref(href: string, locale: string): string {
  if (href === '/') return `/${locale}`
  return `/${locale}${href}`
}

/** Stable row height for alignment; touch-friendly baseline. */
const ROW_MIN = 'min-h-14'

/** Primary nav labels — slightly reduced vs original for better fold fit. */
const linkBase = clsx(
  'py-2 text-2xl font-medium leading-snug text-white/40 transition-colors sm:text-4xl',
  'rounded-lg group-hover:text-primary',
)

/** Expand/collapse control: fixed width band so labels can truncate without stealing space. */
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
  cityItems,
  translations,
  onNavigate,
}: DrawerNavListProps) {
  const path = usePathname()
  const locale = useLocale()
  const citiesPanelId = useId()
  const realtorsPanelId = useId()
  const [citiesOpen, setCitiesOpen] = useState(false)
  const [realtorsOpen, setRealtorsOpen] = useState(false)

  useEffect(() => {
    const citiesBase = `/${locale}/cities`
    const onCityInfo = new RegExp(`^/${locale}/[^/]+/[^/]+/info/?$`).test(path)
    if (path.startsWith(`${citiesBase}/`) || onCityInfo) setCitiesOpen(true)
  }, [path, locale])

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
      setRealtorsOpen(true)
    }
  }, [path, locale])

  const isHomeActive = path === `/${locale}` || path === `/${locale}/`

  const isDealActive = (segment: string) =>
    path === `/${locale}/investment/${segment}` ||
    path === `/${locale}/investment/${encodeURIComponent(segment)}`

  const isCityInfoPath = new RegExp(`^/${locale}/[^/]+/[^/]+/info/?$`).test(path)
  const isCitiesParentActive =
    path === `/${locale}/cities` ||
    path.startsWith(`/${locale}/cities/`) ||
    isCityInfoPath

  const isBlogActive =
    path === `/${locale}/blog` || path.startsWith(`/${locale}/blog/`)

  const isContactsActive =
    path === `/${locale}/contacts` || path === `/${locale}/contactus`

  const childLinkClass =
    'flex min-h-11 min-w-0 items-center truncate py-1.5 text-lg font-medium leading-snug sm:text-2xl'

  return (
    <ul className="w-full">
      {items.map((item) => {
        if (item.kind === 'link') {
          const href = resolvedHref(item.href, locale)
          let active = false
          if (item.key === 'home') active = isHomeActive
          else if (item.key === 'sale') active = isDealActive('sale')
          else if (item.key === 'rent') active = isDealActive('rent')
          else if (item.key === 'shortTermRent') active = isDealActive('short-term-rent')
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
                    'sm:min-h-[3.25rem]',
                  )}
                >
                  <div
                    className={clsx(
                      'flex w-6 shrink-0 flex-col items-center justify-center self-stretch',
                      ROW_MIN,
                      'sm:min-h-[3.25rem]',
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
                      'sm:min-h-[3.25rem]',
                    )}
                    aria-expanded={citiesOpen}
                    aria-controls={citiesPanelId}
                    aria-label={citiesOpen ? collapseLabel : expandLabel}
                    onClick={(e) => {
                      e.preventDefault()
                      setCitiesOpen((o) => !o)
                    }}
                  >
                    <Icon
                      icon="ph:caret-down"
                      width={24}
                      height={24}
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
                    className="mt-2 space-y-0.5 border-l border-white/15 pl-5"
                  >
                    {cityItems.map((c) => {
                      const ch = cityInfoPath(locale, c.slug, c.countrySlug)
                      const childActive = path === ch
                      return (
                        <li key={c.slug}>
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
                    'sm:min-h-[3.25rem]',
                  )}
                >
                  <div
                    className={clsx(
                      'flex w-6 shrink-0 flex-col items-center justify-center self-stretch',
                      ROW_MIN,
                      'sm:min-h-[3.25rem]',
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
                      'sm:min-h-[3.25rem]',
                    )}
                    aria-expanded={realtorsOpen}
                    aria-controls={realtorsPanelId}
                    aria-label={realtorsOpen ? collapseLabel : expandLabel}
                    onClick={(e) => {
                      e.preventDefault()
                      setRealtorsOpen((o) => !o)
                    }}
                  >
                    <Icon
                      icon="ph:caret-down"
                      width={24}
                      height={24}
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
                    className="mt-2 space-y-0.5 border-l border-white/15 pl-5"
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
