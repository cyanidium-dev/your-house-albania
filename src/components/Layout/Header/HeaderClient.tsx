'use client'

import { getNavLinks } from '@/data/navigation'
import Link from 'next/link'
import NavLink from './Navigation/NavLink'
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
  contact: string
  cta: { viewProperties: string }
  nav: Record<string, string>
}

type HeaderClientProps = {
  locale: string
  siteSettings?: ResolvedSiteSettings
  translations: HeaderTranslations
}

const HeaderClient: React.FC<HeaderClientProps> = ({
  locale,
  siteSettings,
  translations: t,
}) => {
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
                <div className="flex flex-col h-full justify-between">
                  <div className="">
                    <div className='flex items-center justify-start py-10'>
                      <button
                        onClick={onClose}
                        aria-label='Close mobile menu'
                        className='bg-white p-3 rounded-full hover:cursor-pointer'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          width='24'
                          height='24'
                          viewBox='0 0 24 24'>
                          <path
                            fill='none'
                            stroke='black'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M6 18L18 6M6 6l12 12'
                          />
                        </svg>
                      </button>
                    </div>
                    <nav className='flex flex-col items-start gap-4'>
                      <ul className='w-full'>
                        {getNavLinks().map((item, index) => (
                          <NavLink key={index} item={{ label: t.nav[item.key] ?? item.key, href: item.href }} onClick={onClose} />
                        ))}
                        <li className='flex items-center gap-4 flex-wrap'>
                          <Link href={catalogPath(locale)} className='py-4 px-8 bg-primary text-base leading-4 block w-fit text-white rounded-full border border-primary font-semibold mt-3 hover:bg-transparent hover:text-primary duration-300'>
                            {t.cta.viewProperties}
                          </Link>
                          <Link href={`/${locale}/contactus`} className='py-4 px-8 bg-transparent border border-primary text-base leading-4 block w-fit text-primary rounded-full font-semibold mt-3 hover:bg-primary hover:text-white duration-300'>
                            {t.nav.contact}
                          </Link>
                        </li>
                      </ul>
                    </nav>
                  </div>

                  <div className='flex flex-col gap-1 my-16 text-white'>
                    <p className='text-base sm:text-xm font-normal text-white/40'>
                      {t.contact}
                    </p>
                    {siteSettings?.email ? (
                      <Link href={`mailto:${siteSettings.email}`} className='text-base sm:text-xm font-medium text-inherit hover:text-primary'>
                        {siteSettings.email}
                      </Link>
                    ) : null}
                    <Link href={catalogPath(locale)} className='text-base sm:text-xm font-medium text-inherit hover:text-primary'>
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
