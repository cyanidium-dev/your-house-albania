import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { PriceTableSection } from '@/components/landing/sections/PriceTableSection'
import { fetchCityCountrySlugByCitySlug, fetchCityListingPriceIndex } from '@/lib/sanity/client'
import { fetchCityNameForms } from '@/lib/sanity/queries/district'
import { resolveLocalizedString } from '@/lib/sanity/localized'

/** A median of two flats is an anecdote, not a price. */
const MIN_ROW_FLATS = 3

const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value, pl: value })

/**
 * What the city's live sale listings on the site actually ask, per district.
 *
 * Sits under the `zoneMetrics` table on city pages. Those figures are market
 * research — sourced, periodic, often ranges; these are our own listings,
 * recomputed hourly, and link straight to the district catalog. Nobody ranking
 * for these cities publishes either, and the second one cannot be copied.
 */
export async function ListingPriceIndexSection({ locale, citySlug }: { locale: string; citySlug: string }) {
  const [rows, country, name, t] = await Promise.all([
    fetchCityListingPriceIndex(citySlug),
    fetchCityCountrySlugByCitySlug(citySlug),
    fetchCityNameForms(citySlug, locale),
    getTranslations({ locale, namespace: 'ZoneMetrics.listingIndex' }),
  ])
  const [city, ...districts] = rows
  const shown = districts.filter((r) => r.flatCount >= MIN_ROW_FLATS)
  if (!city || !country || shown.length < 2) return null

  const money = (n: number | null) =>
    n === null ? '—' : `€${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n)}`
  const cells = (r: (typeof rows)[number]) => [
    loc(String(r.count)),
    loc(money(r.flatPriceFrom)),
    loc(money(r.medianFlatPrice)),
    loc(money(r.medianFlatPricePerSqm)),
  ]

  return (
    <PriceTableSection
      locale={locale}
      section={{
        title: loc(t('title', { city: name.base })),
        subtitle: loc(t('subtitle', { count: city.count, min: MIN_ROW_FLATS })),
        labelHeader: loc(t('district')),
        columns: [loc(t('listings')), loc(t('from')), loc(t('median')), loc(t('medianSqm'))],
        rows: [
          ...shown.map((r) => ({
            _key: r.districtSlug ?? 'row',
            label: loc(resolveLocalizedString(r.districtTitle as never, locale) || r.districtSlug || ''),
            cells: cells(r),
            href: `/${country}/${citySlug}/${r.districtSlug}`,
          })),
          { _key: 'city', label: loc(t('wholeCity', { city: name.base })), cells: cells(city), href: `/${country}/${citySlug}` },
        ],
        sourceNote: loc(t('note')),
      }}
    />
  )
}
