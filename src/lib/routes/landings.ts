import { cityInfoPath } from '@/lib/routes/catalog'

export type LandingPageType = 'home' | 'city' | 'cityIndex' | string

/**
 * Canonical landing href resolver for landing cards.
 * Keep all pageType → route mapping centralized here.
 */
export function landingHref(input: {
  locale: string
  pageType?: LandingPageType | null
  slug?: string | null
  linkedCitySlug?: string | null
  linkedCityCountrySlug?: string | null
}): string {
  const locale = input.locale
  const pageType = input.pageType ?? ''
  const slug = (input.slug ?? '').trim()
  const linkedCitySlug = (input.linkedCitySlug ?? '').trim()
  const linkedCityCountrySlug = (input.linkedCityCountrySlug ?? '').trim()

  if (pageType === 'home') return `/${locale}`
  if (pageType === 'cityIndex') return `/${locale}/cities`
  if (pageType === 'city') {
    const s = (linkedCitySlug || slug).trim()
    return cityInfoPath(locale, s, linkedCityCountrySlug || undefined)
  }

  // Generic landing fallback: /[locale]/{slug}
  if (slug) return `/${locale}/${encodeURIComponent(slug)}`
  return `/${locale}`
}

