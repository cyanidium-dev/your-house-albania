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
}): string {
  const locale = input.locale
  const pageType = input.pageType ?? ''
  const slug = (input.slug ?? '').trim()
  const linkedCitySlug = (input.linkedCitySlug ?? '').trim()

  if (pageType === 'home') return `/${locale}`
  if (pageType === 'cityIndex') return `/${locale}/cities`
  if (pageType === 'city') {
    // City landings are routed by linkedCity slug in this frontend.
    const s = (linkedCitySlug || slug).trim()
    return `/${locale}/cities/${encodeURIComponent(s)}`
  }

  // Generic landing fallback: /[locale]/{slug}
  if (slug) return `/${locale}/${encodeURIComponent(slug)}`
  return `/${locale}`
}

