'use client'

import Link from "@/components/shared/Link";
import { useId, useRef } from 'react'
import { usePathname } from 'next/navigation'
import DrawerNavList from './Navigation/DrawerNavList'
import DesktopNav from './Navigation/DesktopNav'
import { ADD_PROPERTY_HREF, type BuyMenuData, type GuidesMenuData } from '@/data/navConfig'
import HeaderPreferences from './HeaderPreferences'
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
import { brandButtonClass } from '@/components/shared/BrandButton'
import { CONTAINER } from '@/components/shared/layout'

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
  guidesMenu: GuidesMenuData
  /** Hides the assistant entry point when the API key is not configured. */
  aiSearchEnabled?: boolean
}

const HeaderClient: React.FC<HeaderClientProps> = ({
  locale,
  siteSettings,
  countrySlugs,
  translations: t,
  buyMenu,
  guidesMenu,
  aiSearchEnabled = false,
}) => {
  const drawerId = useId()
  const drawerTitleId = useId()
  const burgerRef = useRef<HTMLButtonElement>(null)
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
              {/* The bar's content box is the page container (CONTAINER), so
                  the logo and the last control line up with every section's
                  edges at every width. The bar's background, once it has one,
                  bleeds 8px (16px from md) past them. It used to add its own
                  padding on top of the gutter and sat 7 to 27px off the grid
                  (QA 2026-10-11). */}
              <div className={`${CONTAINER} h-full min-w-0 pt-[max(0.5rem,env(safe-area-inset-top))] md:pt-0`}>
                <nav className={`-mx-2 md:-mx-4 min-w-0 h-full flex items-center justify-between rounded-full transition-[background-color,box-shadow,border-color] duration-300 ease-out py-0.5 pl-4 pr-1.5 md:py-2 md:px-4 ${sticky ? "shadow-sm md:shadow-lg border md:border-0 md:bg-white md:dark:bg-dark bg-white/[0.97] dark:bg-dark/[0.97] backdrop-blur-md border-white/20 dark:border-white/10 border-dark/10" : "shadow-none bg-transparent border border-transparent"}`}>
                  <div className='flex justify-between items-center gap-1.5 md:gap-2 w-full min-w-0'>
                    {/* The logo never shrinks: the row's spare width goes to
                        the nav (lg+) and, below that, stays empty. `max-w-[45%]`
                        used to sit here on the logo itself and, once the logo
                        shared a flex group with the nav, that 45% was of the
                        squeezed group, not the row, and the logo went to 31px. */}
                    <div className="flex min-w-0 flex-1 items-center gap-4 xl:gap-6">
                      <div className="min-w-0 shrink">
                        <Link href={`/${locale}`} className="tap-zone relative h-8 md:h-auto flex items-center max-w-full min-w-0">
                          {siteSettings?.logoUrl ? (
                            <>
                              <Image
                                src={siteSettings.logoUrl}
                                alt={siteSettings?.siteName || 'logo'}
                                width={150}
                                height={68}
                                // Above the fold on every page: lazy-loading it only
                                // painted the brand late (Lighthouse 18.10).
                                loading="eager"
                                // Low, so React does not preload it ahead of the
                                // hero: both come from cdn.sanity.io, and the
                                // preloaded logo went first on that connection
                                // (Lighthouse 19.10).
                                fetchPriority="low"
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
                        guidesMenu={guidesMenu}
                        nav={t.nav}
                        onPhoto={logoOnPhoto}
                        ariaLabel={t.mainNavigation}
                      />
                    </div>
                    {/* Every control is a 44px hit area with its old-size
                        visual inside. Language, currency and theme share one
                        pill (HeaderPreferences), so a 360px phone holds it
                        next to the AI, favourites and menu buttons. On phones the
                        burger circle sits 7px from the bar's top, bottom and
                        right edge, concentric with the rounded end. */}
                    <div className='flex items-center gap-3 md:gap-1 xl:gap-1.5 min-w-0 shrink-0 md:-mr-px'>
                      <HeaderPreferences overHero={overHero} sticky={sticky} />
                      {aiSearchEnabled ? (
                        <HeaderAiSearchLink locale={locale} overHero={overHero} sticky={sticky} />
                      ) : null}
                      <HeaderFavoritesLink locale={locale} overHero={overHero} sticky={sticky} />
                      {/* Tablets keep the button next to the burger; at lg the bar
                          gains its links and loses the room, xl has both. */}
                      <div className="hidden md:block lg:hidden xl:block md:ml-2">
                        <Link
                          href={propertiesHref}
                          className={brandButtonClass('light', 'shadow-sm whitespace-nowrap', 'md')}
                        >
                          {t.cta.viewProperties}
                        </Link>
                      </div>
                      <div className="flex lg:hidden md:ml-1">
                        <HeaderBurgerButton
                          ref={burgerRef}
                          onClick={onToggle}
                          overHero={overHero}
                          sticky={sticky}
                          ariaLabel={t.toggleMobileMenu}
                          expanded={navbarOpen}
                          controls={drawerId}
                        />
                      </div>
                    </div>
                  </div>
                </nav>
              </div>

              <HeaderMobileDrawer
                id={drawerId}
                open={navbarOpen}
                onClose={onClose}
                labelledBy={drawerTitleId}
                returnFocusRef={burgerRef}
              >
                <DrawerNavList
                  locale={locale}
                  buyMenu={buyMenu}
                  guidesMenu={guidesMenu}
                  nav={t.nav}
                  onNavigate={onClose}
                  titleId={drawerTitleId}
                  closeLabel={t.closeMobileMenu}
                  propertiesHref={propertiesHref}
                  viewPropertiesLabel={t.cta.viewProperties}
                  addPropertyHref={addPropertyHref}
                  aiSearchEnabled={aiSearchEnabled}
                />
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
