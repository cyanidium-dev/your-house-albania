'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import DrawerNavList from './Navigation/DrawerNavList'
import DesktopNav from './Navigation/DesktopNav'
import { ADD_PROPERTY_HREF, type BuyMenuData } from '@/data/navConfig'
import LanguageSwitcher from './LanguageSwitcher'
import CurrencySwitcher from './CurrencySwitcher'
import HeaderThemeToggle from './HeaderThemeToggle'
import HeaderAiSearchLink from './HeaderAiSearchLink'
import HeaderFavoritesLink from './HeaderFavoritesLink'
import HeaderBurgerButton from './HeaderBurgerButton'
import HeaderMobileDrawer from './HeaderMobileDrawer'
import HeaderVisualState from './HeaderVisualState'
import HeaderMobileController from './HeaderMobileController'
import Image from 'next/image'
import type { ResolvedSiteSettings } from '@/lib/sanity/siteSettingsAdapter'
import { catalogPath } from '@/lib/routes/catalog'
import { currentCityListingHref } from '@/lib/routes/currentCityListing'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { brandButtonClass } from '@/components/shared/BrandButton'

export type HeaderTranslations = {
  menu: string
  cta: { viewProperties: string }
  nav: Record<string, string>
  toggleMobileMenu: string
  switchToLightMode: string
  switchToDarkMode: string
  selectLanguage: string
  closeMobileMenu: string
  mainNavigation: string
}

type HeaderClientProps = {
  locale: string
  siteSettings?: ResolvedSiteSettings
  countrySlugs: string[]
  translations: HeaderTranslations
  buyMenu: BuyMenuData
  /** Hides the assistant entry point when the API key is not configured. */
  aiSearchEnabled?: boolean
}

const HeaderClient: React.FC<HeaderClientProps> = ({
  locale,
  siteSettings,
  countrySlugs,
  translations: t,
  buyMenu,
  aiSearchEnabled = false,
}) => {
  const [drawerPricesOpen, setDrawerPricesOpen] = useState(false)
  // Inside a city — its listing, a district, its /info page — "View
  // properties" means that city's, not a jump out to the whole country.
  const pathname = usePathname()
  const propertiesHref = currentCityListingHref(pathname, routing.locales, countrySlugs) ?? catalogPath(locale)
  const addPropertyHref = `/${locale}${ADD_PROPERTY_HREF}`

  return (
    <HeaderVisualState>
      {({ sticky, overHero, isCatalog }) => {
        // Airbnb-style: on catalog/listing routes the header condenses while scrolled.
        const shrink = sticky && isCatalog
        const logoSizeClass = shrink
          ? "md:h-12 md:w-[105px]"
          : "md:h-[68px] md:w-[150px]"
        // Floating over the hero photograph, before the bar gets its own
        // background. The CMS logo is dark artwork, so it has to be knocked out
        // to white in BOTH themes here — `dark:` alone left it black-on-black
        // over a photo in the light theme.
        const logoOnPhoto = overHero && !sticky
        return (
        <HeaderMobileController>
          {({ open: navbarOpen, onClose, onToggle }) => (
            <header className={`fixed left-0 right-0 z-50 bg-transparent transition-all duration-300 top-0 ${sticky ? "md:top-3" : ""} min-h-[3.25rem] md:min-h-0 ${shrink ? "md:h-16" : "md:h-24"} md:py-1`}>
              <div className="h-full min-w-0 px-4 lg:px-0 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-0">
                <nav className={`container mx-auto max-w-8xl min-w-0 h-full flex items-center justify-between rounded-full transition-[background-color,box-shadow,border-color] duration-300 ease-out py-2 px-3 md:py-4 ${sticky ? "shadow-sm md:shadow-lg border md:border-0 md:bg-white md:dark:bg-dark md:px-4 bg-white/90 dark:bg-white/10 backdrop-blur-md border-white/20 dark:border-white/10 border-dark/10" : "shadow-none bg-transparent border border-transparent"}`}>
                  <div className='flex justify-between items-center gap-1.5 md:gap-2 w-full min-w-0'>
                    {/* The logo never shrinks: the row's spare width goes to
                        the nav (lg+) and, below that, stays empty. `max-w-[45%]`
                        used to sit here on the logo itself and, once the logo
                        shared a flex group with the nav, that 45% was of the
                        squeezed group, not the row, and the logo went to 31px. */}
                    <div className="flex min-w-0 flex-1 items-center gap-4 xl:gap-6">
                      <div className="ml-0.5 md:ml-[14px] min-w-0 shrink">
                        <Link href={`/${locale}`} className="h-8 md:h-auto flex items-center max-w-full min-w-0">
                          {siteSettings?.logoUrl ? (
                            <>
                              <Image
                                src={siteSettings.logoUrl}
                                alt={siteSettings?.siteName || 'logo'}
                                width={150}
                                height={68}
                                className={`object-contain object-left h-7 sm:h-8 w-auto transition-[height,width] duration-300 ease-out ${logoSizeClass} ${logoOnPhoto ? "brightness-0 invert" : "dark:brightness-0 dark:invert"}`}
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
                                className={`object-contain object-left h-7 sm:h-8 w-auto transition-[height,width] duration-300 ease-out ${logoSizeClass} ${overHero ? sticky ? "block dark:hidden" : "hidden" : sticky ? "block dark:hidden" : "block dark:hidden"}`}
                              />
                              <Image
                                src={'/images/header/logo.svg'}
                                alt='logo'
                                width={150}
                                height={68}
                                unoptimized={true}
                                className={`object-contain object-left h-7 sm:h-8 w-auto transition-[height,width] duration-300 ease-out ${logoSizeClass} ${overHero ? sticky ? "hidden dark:block" : "block" : sticky ? "dark:block hidden" : "dark:block hidden"}`}
                              />
                            </>
                          )}
                        </Link>
                      </div>
                      <DesktopNav
                        locale={locale}
                        buyMenu={buyMenu}
                        nav={t.nav}
                        onPhoto={logoOnPhoto}
                        ariaLabel={t.mainNavigation}
                      />
                    </div>
                    <div className='flex items-center gap-1 sm:gap-3 xl:gap-4 min-w-0 shrink-0'>
                      <LanguageSwitcher overHero={overHero} sticky={sticky} />
                      <CurrencySwitcher overHero={overHero} sticky={sticky} />
                      <HeaderThemeToggle overHero={overHero} sticky={sticky} lightModeLabel={t.switchToLightMode} darkModeLabel={t.switchToDarkMode} />
                      {aiSearchEnabled ? (
                        <HeaderAiSearchLink locale={locale} overHero={overHero} sticky={sticky} />
                      ) : null}
                      <HeaderFavoritesLink locale={locale} overHero={overHero} sticky={sticky} />
                      {/* Tablets keep the button next to the burger; at lg the bar
                          gains its links and loses the room, xl has both. */}
                      <div className="hidden md:block lg:hidden xl:block">
                        <Link
                          href={propertiesHref}
                          className={brandButtonClass('light', 'shadow-sm whitespace-nowrap', 'md')}
                        >
                          {t.cta.viewProperties}
                        </Link>
                      </div>
                      <div className="lg:hidden">
                        <HeaderBurgerButton
                          onClick={onToggle}
                          overHero={overHero}
                          sticky={sticky}
                          menuLabel={t.menu}
                          ariaLabel={t.toggleMobileMenu}
                        />
                      </div>
                    </div>
                  </div>
                </nav>
              </div>

              <HeaderMobileDrawer open={navbarOpen} onClose={onClose}>
                <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden px-8 sm:px-16 md:px-20">
                  <div className="shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
                    <div className="flex w-full items-center justify-end py-4 md:py-5">
                      <button
                        onClick={onClose}
                        aria-label={t.closeMobileMenu}
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

                  <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                    <nav className="flex min-h-0 flex-col items-start gap-2 sm:gap-2.5 pb-4" aria-label={t.mainNavigation}>
                      <DrawerNavList
                        locale={locale}
                        buyMenu={buyMenu}
                        translations={{ nav: t.nav }}
                        onNavigate={onClose}
                        pricesOpen={drawerPricesOpen}
                        onPricesOpenChange={setDrawerPricesOpen}
                      />
                    </nav>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <Link
                      href={propertiesHref}
                      className={brandButtonClass('primary', 'w-fit', 'md')}
                      onClick={onClose}
                    >
                      {t.cta.viewProperties}
                    </Link>
                    {/* The owner's and the agency's way in: a note on the
                        contact page, not a section of the menu. */}
                    <Link
                      href={addPropertyHref}
                      className="text-sm font-medium text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"
                      onClick={onClose}
                    >
                      {t.nav.addProperty}
                    </Link>
                  </div>
                </div>
              </HeaderMobileDrawer>
            </header>
          )}
        </HeaderMobileController>
        )
      }}
    </HeaderVisualState>
  )
}

export default HeaderClient
