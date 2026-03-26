import { getTranslations } from 'next-intl/server'
import HeaderClient from './HeaderClient'
import type { ResolvedSiteSettings } from '@/lib/sanity/siteSettingsAdapter'
import type { HeaderTranslations } from './HeaderClient'
import { fetchCityLandingNavItems } from '@/lib/sanity/client'

const NAV_TRANSLATION_KEYS = [
  'home',
  'sale',
  'rent',
  'shortTermRent',
  'cities',
  'realtors',
  'realtorsAbout',
  'realtorsRegister',
  'expandRealtors',
  'collapseRealtors',
  'blog',
  'contacts',
  'expandCities',
  'collapseCities',
] as const

type HeaderProps = {
  siteSettings?: ResolvedSiteSettings
  locale: string
}

export default async function Header({ siteSettings, locale }: HeaderProps) {
  const t = await getTranslations('Header')
  const cityNavItems = await fetchCityLandingNavItems(locale)

  const translations: HeaderTranslations = {
    menu: t('menu'),
    contact: t('contact'),
    cta: { viewProperties: t('cta.viewProperties') },
    nav: Object.fromEntries(
      NAV_TRANSLATION_KEYS.map((key) => [key, t(`nav.${key}`)]),
    ),
  }

  return (
    <HeaderClient
      locale={locale}
      siteSettings={siteSettings}
      translations={translations}
      cityNavItems={cityNavItems}
    />
  )
}
