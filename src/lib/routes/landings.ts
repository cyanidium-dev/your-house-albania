import { cityInfoPath, districtInfoPath } from '@/lib/routes/catalog'

export type LandingPageType = 'home' | 'city' | 'cityIndex' | 'district' | string

/** `linkedDistrict` card projection: district slug + city/country slugs via the ref chain. */
export type LandingHrefLinkedDistrict = {
  slug?: string | null
  citySlug?: string | null
  countrySlug?: string | null
}

/**
 * CMS slug → `/investment/{deal}` route segment for investment landings.
 * The CMS documents use `long-term-rent` while the App Router editorial route is
 * `/investment/rent` — mapped here in code. Canonically the CMS slug should be
 * renamed to `rent`, but slug-based fetchers may depend on it, so we only map.
 */
const INVESTMENT_SLUG_TO_DEAL_SEGMENT: Record<string, string> = {
  sale: 'sale',
  rent: 'rent',
  'long-term-rent': 'rent',
  'short-term-rent': 'short-term-rent',
}

/**
 * Canonical landing href resolver for landing cards.
 * Keep all pageType → route mapping centralized here.
 *
 * Returns `null` when no valid public URL can be built (currently: district
 * landings with an incomplete district→city→country slug chain) — callers must
 * skip rendering the card instead of emitting a broken link.
 */
export function landingHref(input: {
  locale: string
  pageType?: LandingPageType | null
  slug?: string | null
  linkedCitySlug?: string | null
  linkedCityCountrySlug?: string | null
  linkedDistrict?: LandingHrefLinkedDistrict | null
}): string | null {
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
  if (pageType === 'district') {
    const districtSlug = (input.linkedDistrict?.slug ?? '').trim()
    const citySlug = (input.linkedDistrict?.citySlug ?? '').trim()
    const countrySlug = (input.linkedDistrict?.countrySlug ?? '').trim()
    if (!districtSlug || !citySlug || !countrySlug) return null
    return districtInfoPath(locale, citySlug, districtSlug, countrySlug)
  }
  if (pageType === 'investment') {
    const dealSegment = INVESTMENT_SLUG_TO_DEAL_SEGMENT[slug]
    // Unknown slug → no routable editorial page; skip the card (same rule as districts).
    if (!dealSegment) return null
    return `/${locale}/investment/${dealSegment}`
  }

  // `for-realtors` keeps its dedicated route regardless of pageType.
  if (slug === 'for-realtors') return `/${locale}/for-realtors`

  // Custom editorial landings live on the universal guides route.
  if (pageType === 'custom' && slug) return `/${locale}/guides/${encodeURIComponent(slug)}`

  // Generic landing fallback: /[locale]/{slug}
  if (slug) return `/${locale}/${encodeURIComponent(slug)}`
  return `/${locale}`
}
