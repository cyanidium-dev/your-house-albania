import { getTranslations } from 'next-intl/server'
import HeaderClient from './HeaderClient'
import { isAiSearchEnabled } from '@/lib/ai/config'
import type { ResolvedSiteSettings } from '@/lib/sanity/siteSettingsAdapter'
import type { HeaderTranslations } from './HeaderClient'
import { fetchFooterCitiesByCountry } from '@/lib/sanity/client'
import { fetchCityLandingNavItems } from '@/lib/sanity/queries/landing'
import { LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG, catalogFilterPath, cityInfoPath, nonGeoDealListingPath } from '@/lib/routes/catalog'
import {
  MAX_MENU_CITIES,
  MAX_MENU_PRICE_PAGES,
  orderMenuCities,
  type BuyMenuData,
} from '@/data/navConfig'

const NAV_TRANSLATION_KEYS = [
  'buy',
  'guides',
  'blog',
  'about',
  'contacts',
  'prices',
  'allListings',
  'allCities',
  'buyCities',
  'buyPrices',
  'addProperty',
  'openBuyMenu',
  'closeBuyMenu',
  'expandPrices',
  'collapsePrices',
] as const

type HeaderProps = {
  siteSettings?: ResolvedSiteSettings
  locale: string
  countrySlugs: string[]
}

/**
 * The Buy menu's contents, once per request: cities with public listings
 * (largest first, Durrës and Tirana pinned) and the cities that have a price
 * page. Both lists are cached Sanity reads shared with the footer and /cities.
 */
async function buildBuyMenu(locale: string): Promise<BuyMenuData> {
  const country = LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG
  const [cities, priceCities] = await Promise.all([
    fetchFooterCitiesByCountry(locale, country, 12),
    fetchCityLandingNavItems(locale),
  ])
  return {
    cities: orderMenuCities(cities, MAX_MENU_CITIES).map((c) => ({
      key: c.slug,
      label: c.label,
      href: catalogFilterPath({
        locale,
        city: c.slug,
        trustedCityCountrySlug: c.countrySlug,
        country: c.countrySlug ?? country,
      }),
    })),
    priceCities: orderMenuCities(priceCities, MAX_MENU_PRICE_PAGES).map((c) => ({
      key: c.slug,
      label: c.label,
      href: cityInfoPath(locale, c.slug, c.countrySlug ?? country),
    })),
    allListingsHref: nonGeoDealListingPath(locale, 'sale'),
    allCitiesHref: `/${locale}/cities`,
  }
}

export default async function Header({ siteSettings, locale, countrySlugs }: HeaderProps) {
  const [t, buyMenu] = await Promise.all([getTranslations('Header'), buildBuyMenu(locale)])

  const translations: HeaderTranslations = {
    menu: t('menu'),
    cta: { viewProperties: t('cta.viewProperties') },
    nav: Object.fromEntries(
      NAV_TRANSLATION_KEYS.map((key) => [key, t(`nav.${key}`)]),
    ),
    toggleMobileMenu: t('toggleMobileMenu'),
    switchToLightMode: t('switchToLightMode'),
    switchToDarkMode: t('switchToDarkMode'),
    selectLanguage: t('selectLanguage'),
    closeMobileMenu: t('closeMobileMenu'),
    mainNavigation: t('mainNavigation'),
  }

  return (
    <HeaderClient
      locale={locale}
      siteSettings={siteSettings}
      countrySlugs={countrySlugs}
      translations={translations}
      buyMenu={buyMenu}
      aiSearchEnabled={isAiSearchEnabled()}
    />
  )
}
