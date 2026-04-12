import { getTranslations } from 'next-intl/server'
import HeaderClient from './HeaderClient'
import type { ResolvedSiteSettings } from '@/lib/sanity/siteSettingsAdapter'
import type { HeaderTranslations } from './HeaderClient'

const NAV_TRANSLATION_KEYS = [
  'home',
  'buy',
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
  countrySlugs: string[]
}

export default async function Header({ siteSettings, locale, countrySlugs }: HeaderProps) {
  const t = await getTranslations('Header')

  const translations: HeaderTranslations = {
    menu: t('menu'),
    cta: { viewProperties: t('cta.viewProperties') },
    nav: Object.fromEntries(
      NAV_TRANSLATION_KEYS.map((key) => [key, t(`nav.${key}`)]),
    ),
  }

  return (
    <HeaderClient
      locale={locale}
      siteSettings={siteSettings}
      countrySlugs={countrySlugs}
      translations={translations}
    />
  )
}
