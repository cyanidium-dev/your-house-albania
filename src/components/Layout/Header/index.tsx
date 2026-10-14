import { getTranslations } from 'next-intl/server'
import HeaderClient from './HeaderClient'
import { isAiSearchEnabled } from '@/lib/ai/config'
import type { ResolvedSiteSettings } from '@/lib/sanity/siteSettingsAdapter'
import type { HeaderTranslations } from './HeaderClient'
import { fetchFooterCitiesByCountry, fetchGuideIndexEntries } from '@/lib/sanity/client'
import { fetchNavGuidePosts, fetchNavPropertyTypes } from '@/lib/sanity/queries/navMenu'
import { isLandingInLocale } from '@/lib/landing/localeScope'
import { buildGuidesMenu } from '@/lib/nav/guidesMenu'
import { GUIDE_TOPICS } from '@/data/guideTopics'
import { formatBlogDate } from '@/lib/date/formatLocale'
import { fetchCityLandingNavItems } from '@/lib/sanity/queries/landing'
import { LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG, catalogFilterPath, cityInfoPath, nonGeoDealListingPath } from '@/lib/routes/catalog'
import {
  MAX_MENU_CITIES,
  MAX_MENU_PRICE_PAGES,
  MAX_MENU_PROPERTY_TYPES,
  orderMenuCities,
  type BuyMenuData,
  type GuidesMenuData,
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
  'openGuidesMenu',
  'closeGuidesMenu',
  'guideTopics',
  'latestGuides',
  'allGuides',
  'allArticles',
  'propertyTypes',
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
  const [cities, priceCities, types, tTypes] = await Promise.all([
    fetchFooterCitiesByCountry(locale, country, 12),
    fetchCityLandingNavItems(locale),
    fetchNavPropertyTypes(),
    getTranslations('Seo.listing.types'),
  ])
  // The price column follows the listing column's order (stock, then the
  // rest of the CMS alphabetically), so a city sits at the same height in both.
  const listingRank = new Map(cities.map((c, i) => [c.slug.toLowerCase(), i]))
  const rankedPriceCities = [...priceCities].sort(
    (a, b) =>
      (listingRank.get(a.slug.toLowerCase()) ?? Number.MAX_SAFE_INTEGER) -
      (listingRank.get(b.slug.toLowerCase()) ?? Number.MAX_SAFE_INTEGER),
  )
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
      count: c.count,
    })),
    priceCities: orderMenuCities(rankedPriceCities, MAX_MENU_PRICE_PAGES).map((c) => ({
      key: c.slug,
      label: c.label,
      href: cityInfoPath(locale, c.slug, c.countrySlug ?? country),
    })),
    allListingsHref: nonGeoDealListingPath(locale, 'sale'),
    allCitiesHref: `/${locale}/cities`,
    // Plural labels from the listing titles ("Apartments"), the same words
    // the page they open uses as its heading.
    types: types.slice(0, MAX_MENU_PROPERTY_TYPES).map((type) => ({
      key: type.slug,
      label: tTypes.has(type.slug) ? tTypes(type.slug) : type.slug.replace(/-/g, ' '),
      href: nonGeoDealListingPath(locale, 'sale', type.slug),
      count: type.count,
    })),
  }
}

/**
 * The Guides menu: topics over the blog categories (src/data/guideTopics.ts)
 * with their counts, the comparisons on /guides, the newest articles.
 */
async function buildGuidesMenuData(locale: string): Promise<GuidesMenuData> {
  const [posts, guides, t] = await Promise.all([
    fetchNavGuidePosts(),
    fetchGuideIndexEntries(),
    getTranslations('Header.guideTopics'),
  ])
  const menu = buildGuidesMenu({
    locale,
    posts,
    guides: guides.filter((g) => isLandingInLocale(g, locale)),
    labels: {
      ...(Object.fromEntries(GUIDE_TOPICS.map((topic) => [topic.key, t(topic.key)])) as Record<
        (typeof GUIDE_TOPICS)[number]['key'],
        string
      >),
      comparisons: t('comparisons'),
    },
  })
  // Dates are formatted here so the client bundle does not carry date-fns locales.
  return {
    ...menu,
    latest: menu.latest.map((post) => {
      const date = post.publishedAt ? new Date(post.publishedAt) : null
      return date && !Number.isNaN(date.getTime()) ? { ...post, dateLabel: formatBlogDate(date, locale) } : post
    }),
  }
}

export default async function Header({ siteSettings, locale, countrySlugs }: HeaderProps) {
  const [t, buyMenu, guidesMenu] = await Promise.all([
    getTranslations('Header'),
    buildBuyMenu(locale),
    buildGuidesMenuData(locale),
  ])

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
      guidesMenu={guidesMenu}
      aiSearchEnabled={isAiSearchEnabled()}
    />
  )
}
