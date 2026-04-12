'use client'

import Link from 'next/link'
import { useState } from 'react'
import DrawerNavList from './Navigation/DrawerNavList'
import { DRAWER_NAV_ITEMS } from '@/data/navConfig'
import LanguageSwitcher from './LanguageSwitcher'
import CurrencySwitcher from './CurrencySwitcher'
import HeaderThemeToggle from './HeaderThemeToggle'
import HeaderFavoritesLink from './HeaderFavoritesLink'
import HeaderBurgerButton from './HeaderBurgerButton'
import HeaderMobileDrawer from './HeaderMobileDrawer'
import HeaderVisualState from './HeaderVisualState'
import HeaderMobileController from './HeaderMobileController'
import Image from 'next/image'
import type { ResolvedSiteSettings } from '@/lib/sanity/siteSettingsAdapter'
import { catalogPath } from '@/lib/routes/catalog'
import { cn } from '@/lib/utils'

export type HeaderTranslations = {
  menu: string
  cta: { viewProperties: string }
  nav: Record<string, string>
}

type HeaderClientProps = {
  locale: string
  siteSettings?: ResolvedSiteSettings
  countrySlugs: string[]
  translations: HeaderTranslations
}

const HeaderClient: React.FC<HeaderClientProps> = ({
  locale,
  siteSettings,
  countrySlugs,
  translations: t,
}) => {
  const [drawerCitiesOpen, setDrawerCitiesOpen] = useState(false)
  const [drawerRealtorsOpen, setDrawerRealtorsOpen] = useState(false)
  const drawerExpanded = drawerCitiesOpen || drawerRealtorsOpen

  return (
    <HeaderVisualState>
      {({ sticky, isHomepage }) => (
        <HeaderMobileController>
          {({ open: navbarOpen, onClose, onToggle }) => (
            <header className={`fixed left-0 right-0 z-50 bg-transparent transition-all duration-300 top-0 ${sticky ? "md:top-3" : ""} min-h-[3.25rem] md:min-h-0 md:h-24 md:py-1`}>
              <div className="h-full min-w-0 px-4 lg:px-0 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-0">
                <nav className={`container mx-auto max-w-8xl min-w-0 h-full flex items-center justify-between rounded-full transition-[background-color,box-shadow,border-color] duration-300 ease-out py-2 px-3 md:py-4 ${sticky ? "shadow-sm md:shadow-lg border md:border-0 md:bg-white md:dark:bg-dark md:px-4 bg-white/90 dark:bg-white/10 backdrop-blur-md border-white/20 dark:border-white/10 border-dark/10" : "shadow-none bg-transparent border border-transparent"}`}>
                  <div className='flex justify-between items-center gap-1.5 md:gap-2 w-full min-w-0'>
                    <div className="ml-0.5 md:ml-[14px] min-w-0 max-w-[45%] md:max-w-none shrink">
                      <Link href={`/${locale}`} className="h-8 md:h-auto flex items-center max-w-full min-w-0">
                        {siteSettings?.logoUrl ? (
                          <>
                            <Image
                              src={siteSettings.logoUrl}
                              alt={siteSettings?.siteName || 'logo'}
                              width={150}
                              height={68}
                              unoptimized={siteSettings.logoUrl.startsWith('http')}
                              className={`object-contain object-left h-7 sm:h-8 w-auto md:h-[68px] md:w-[150px] ${isHomepage ? sticky ? "block dark:hidden" : "hidden" : sticky ? "block dark:hidden" : "block dark:hidden"}`}
                            />
                            <Image
                              src={siteSettings.logoUrl}
                              alt={siteSettings?.siteName || 'logo'}
                              width={150}
                              height={68}
                              unoptimized={siteSettings.logoUrl.startsWith('http')}
                              className={`object-contain object-left h-7 sm:h-8 w-auto md:h-[68px] md:w-[150px] dark:brightness-0 dark:invert ${isHomepage ? sticky ? "hidden dark:block" : "block" : sticky ? "dark:block hidden" : "dark:block hidden"}`}
                            />
                          </>
                        ) : (
                          <>
                            <Image
                              src={'/images/header/dark-logo.svg'}
                              alt='logo'
                              width={150}
                              height={68}
                              unoptimized={true}
                              className={`object-contain object-left h-7 sm:h-8 w-auto md:h-[68px] md:w-[150px] ${isHomepage ? sticky ? "block dark:hidden" : "hidden" : sticky ? "block dark:hidden" : "block dark:hidden"}`}
                            />
                            <Image
                              src={'/images/header/logo.svg'}
                              alt='logo'
                              width={150}
                              height={68}
                              unoptimized={true}
                              className={`object-contain object-left h-7 sm:h-8 w-auto md:h-[68px] md:w-[150px] ${isHomepage ? sticky ? "hidden dark:block" : "block" : sticky ? "dark:block hidden" : "dark:block hidden"}`}
                            />
                          </>
                        )}
                      </Link>
                    </div>
                    <div className='flex items-center gap-1 sm:gap-4 min-w-0 shrink-0'>
                      <LanguageSwitcher />
                      <CurrencySwitcher />
                      <HeaderThemeToggle isHomepage={isHomepage} sticky={sticky} />
                      <HeaderFavoritesLink locale={locale} isHomepage={isHomepage} sticky={sticky} />
                      <div className="hidden md:block">
                        <Link
                          href={catalogPath(locale)}
                          className={cn(
                            'inline-flex items-center justify-center px-5 py-3 rounded-full font-semibold whitespace-nowrap text-sm md:text-base',
                            'bg-white text-dark shadow-sm border border-white/30',
                            'transition-[background-color,color,box-shadow,border-color] duration-300 ease-out',
                            'hover:bg-primary hover:text-white hover:border-primary/40 hover:shadow-md',
                            'dark:bg-white dark:text-dark dark:hover:bg-primary dark:hover:text-white',
                            'border-r-0'
                          )}
                        >
                          {t.cta.viewProperties}
                        </Link>
                      </div>
                      <div>
                        <HeaderBurgerButton
                          onClick={onToggle}
                          isHomepage={isHomepage}
                          sticky={sticky}
                          menuLabel={t.menu}
                        />
                      </div>
                    </div>
                  </div>
                </nav>
              </div>

              <HeaderMobileDrawer open={navbarOpen} onClose={onClose}>
                <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden px-12 sm:px-16 md:px-20">
                  <div className="shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
                    <div className="flex w-full items-center justify-end py-4 md:py-5">
                      <button
                        onClick={onClose}
                        aria-label="Close mobile menu"
                        className="rounded-full bg-white p-3 hover:cursor-pointer"
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            fill="none"
                            stroke="black"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'no-scrollbar min-h-0 flex-1 flex flex-col',
                      drawerExpanded ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden',
                    )}
                  >
                    <nav className="flex min-h-0 flex-1 flex-col items-start gap-2 sm:gap-2.5" aria-label="Main">
                      <DrawerNavList
                        items={DRAWER_NAV_ITEMS}
                        countrySlugs={countrySlugs}
                        translations={{ nav: t.nav }}
                        onNavigate={onClose}
                        citiesOpen={drawerCitiesOpen}
                        onCitiesOpenChange={setDrawerCitiesOpen}
                        realtorsOpen={drawerRealtorsOpen}
                        onRealtorsOpenChange={setDrawerRealtorsOpen}
                      />
                    </nav>
                  </div>

                  <div className="shrink-0 border-t border-white/10 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <Link
                      href={catalogPath(locale)}
                      className="inline-flex w-fit min-h-11 items-center justify-center rounded-full border border-primary bg-primary px-7 py-3.5 text-base font-semibold leading-tight text-white duration-300 hover:bg-transparent hover:text-primary"
                      onClick={onClose}
                    >
                      {t.cta.viewProperties}
                    </Link>
                  </div>
                </div>
              </HeaderMobileDrawer>
            </header>
          )}
        </HeaderMobileController>
      )}
    </HeaderVisualState>
  )
}

export default HeaderClient
