'use client'
import { getNavLinks } from '@/data/navigation'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'
import NavLink from './Navigation/NavLink'
import LanguageSwitcher from './LanguageSwitcher'
import { useFavorites } from '@/hooks/useFavorites'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import type { ResolvedSiteSettings } from '@/lib/sanity/siteSettingsAdapter'

type HeaderProps = {
  siteSettings?: ResolvedSiteSettings;
};

const Header: React.FC<HeaderProps> = ({ siteSettings }) => {
  const [sticky, setSticky] = useState(false)
  const [navbarOpen, setNavbarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('Header')
  const { favorites } = useFavorites()

  const sideMenuRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (sideMenuRef.current && !sideMenuRef.current.contains(event.target as Node)) {
      setNavbarOpen(false)
    }
  }

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleScroll])

  const isHomepage = pathname === "/" || /^\/(en|uk|ru|al|it)\/?$/.test(pathname)

  return (
    <header className={`fixed h-24 py-1 z-50 w-full bg-transparent transition-all duration-300 lg:px-0 px-4 ${sticky ? "top-3" : "top-0"}`}>
      <nav className={`container mx-auto max-w-8xl flex items-center justify-between py-4 rounded-full transition-[background-color,box-shadow] duration-300 ease-out ${sticky ? "shadow-lg bg-white dark:bg-dark top-5 px-4" : "shadow-none bg-transparent top-0"}`}>
        <div className='flex justify-between items-center gap-2 w-full'>
          <div className="ml-[14px]">
            <Link href={`/${locale}`}>
              {siteSettings?.logoUrl ? (
                <>
                  <Image
                    src={siteSettings.logoUrl}
                    alt={siteSettings?.siteName || 'logo'}
                    width={150}
                    height={68}
                    unoptimized={siteSettings.logoUrl.startsWith('http')}
                    className={`object-contain object-left ${isHomepage ? sticky ? "block dark:hidden" : "hidden" : sticky ? "block dark:hidden" : "block dark:hidden"}`}
                  />
                  <Image
                    src={siteSettings.logoUrl}
                    alt={siteSettings?.siteName || 'logo'}
                    width={150}
                    height={68}
                    unoptimized={siteSettings.logoUrl.startsWith('http')}
                    className={`object-contain object-left dark:brightness-0 dark:invert ${isHomepage ? sticky ? "hidden dark:block" : "block" : sticky ? "dark:block hidden" : "dark:block hidden"}`}
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
                    className={`${isHomepage ? sticky ? "block dark:hidden" : "hidden" : sticky ? "block dark:hidden" : "block dark:hidden"}`}
                  />
                  <Image
                    src={'/images/header/logo.svg'}
                    alt='logo'
                    width={150}
                    height={68}
                    unoptimized={true}
                    className={`${isHomepage ? sticky ? "hidden dark:block" : "block" : sticky ? "dark:block hidden" : "dark:block hidden"}`}
                  />
                </>
              )}
            </Link>
          </div>
          <div className='flex items-center gap-2 sm:gap-6'>
            <LanguageSwitcher />
            <button
              className='hover:cursor-pointer transition-colors duration-300 ease-out'
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Icon
                icon={'solar:sun-bold'}
                width={32}
                height={32}
                className={`dark:hidden block ${isHomepage
                  ? sticky
                    ? 'text-dark'
                    : 'text-white'
                  : 'text-dark'
                  }`}
              />
              <Icon
                icon={'solar:moon-bold'}
                width={32}
                height={32}
                className='dark:block hidden text-white'
              />
            </button>
            <Link
              href={`/${locale}/favorites`}
              aria-label={`Favorites (${favorites.length})`}
              data-favorites-target="true"
              className={`relative flex items-center justify-center transition-colors duration-300 ease-out hover:cursor-pointer hover:text-primary ${isHomepage
                ? sticky
                  ? 'text-dark dark:text-white'
                  : 'text-white'
                : 'text-dark dark:text-white'
                }`}
            >
              <Icon icon={'ph:heart'} width={24} height={24} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-white text-[11px] font-semibold">
                  {favorites.length > 99 ? '99+' : favorites.length}
                </span>
              )}
            </Link>
            <div className={`hidden md:block`}>
              <Link href={siteSettings?.phone ? `tel:${siteSettings.phone.replace(/\s/g, '')}` : '#'} className={`text-base text-inherit flex items-center gap-2 border-r pr-6 transition-colors duration-300 ease-out ${isHomepage
                ? sticky
                  ? 'text-dark dark:text-white hover:text-primary border-dark dark:border-white'
                  : 'text-white hover:text-primary'
                : 'text-dark hover:text-primary'
                }`}
              >
                <Icon icon={'ph:phone-bold'} width={24} height={24} />
                {siteSettings?.phone || '+1-212-456-789'}
              </Link>
            </div>
            <div>
              <button
                onClick={() => setNavbarOpen(!navbarOpen)}
                className={`flex items-center gap-3 p-2 sm:px-5 sm:py-3 rounded-full font-semibold hover:cursor-pointer border transition-colors duration-300 ease-out ${isHomepage
                  ? sticky
                    ? 'text-white bg-dark dark:bg-white dark:text-dark dark:hover:text-white dark:hover:bg-dark hover:text-dark hover:bg-white border-dark dark:border-white'
                    : 'text-dark bg-white dark:text-dark hover:bg-transparent hover:text-white border-white'
                  : 'bg-dark text-white hover:bg-transparent hover:text-dark dark:bg-white dark:text-dark dark:hover:bg-transparent dark:hover:text-white duration-300'
                  }`}
                aria-label='Toggle mobile menu'>
                <span>
                  <Icon icon={'ph:list'} width={24} height={24} />
                </span>
                <span className='hidden sm:block'>{t('menu')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {
        navbarOpen && (
          <div className='fixed top-0 left-0 w-full h-full bg-black/50 z-40' />
        )
      }

      <div
        ref={sideMenuRef}
        className={`fixed top-0 right-0 h-full w-full bg-dark shadow-lg transition-transform duration-300 max-w-2xl ${navbarOpen ? 'translate-x-0' : 'translate-x-full'} z-50 px-20 overflow-auto no-scrollbar`}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="">
            <div className='flex items-center justify-start py-10'>
              <button
                onClick={() => setNavbarOpen(false)}
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
                  <NavLink key={index} item={{ label: t(`nav.${item.key}`), href: item.href }} onClick={() => setNavbarOpen(false)} />
                ))}
                <li className='flex items-center gap-4'>
                  <Link href={`/${locale}/contactus`} className='py-4 px-8 bg-primary text-base leading-4 block w-fit text-white rounded-full border border-primary font-semibold mt-3 hover:bg-transparent hover:text-primary duration-300'>
                    {t('signIn')}
                  </Link>
                  <Link href={`/${locale}`} className='py-4 px-8 bg-transparent border border-primary text-base leading-4 block w-fit text-primary rounded-full font-semibold mt-3 hover:bg-primary hover:text-white duration-300'>
                    {t('signUp')}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className='flex flex-col gap-1 my-16 text-white'>
            <p className='text-base sm:text-xm font-normal text-white/40'>
              {t('contact')}
            </p>
            <Link href={siteSettings?.email ? `mailto:${siteSettings.email}` : '#'} className='text-base sm:text-xm font-medium text-inherit hover:text-primary'>
              {siteSettings?.email || 'hello@homely.com'}
            </Link>
            <Link href={siteSettings?.phone ? `tel:${siteSettings.phone.replace(/\s/g, '')}` : '#'} className='text-base sm:text-xm font-medium text-inherit hover:text-primary'>
              {siteSettings?.phone || '+1-212-456-7890'}
            </Link>
          </div>
        </div>
      </div>
    </header >
  )
}

export default Header
