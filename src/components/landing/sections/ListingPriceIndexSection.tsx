import * as React from 'react'
import { getTranslations } from 'next-intl/server'
import { PriceTableSection } from '@/components/landing/sections/PriceTableSection'
import { fetchPriceIndexSnapshot } from '@/lib/sanity/client'
import { fetchCityNameForms } from '@/lib/sanity/queries/district'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { formatBlogDate } from '@/lib/date/formatLocale'
import { findIndexCity, MIN_HEADLINE_SAMPLE, type PriceIndexFigures } from '@/lib/priceIndex/snapshot'
import { methodologyPath } from '@/lib/priceIndex/publish'

/** A median of two flats is an anecdote, not a price. */
const MIN_ROW_FLATS = 3

const loc = (value: string) => ({ en: value, uk: value, ru: value, sq: value, it: value, pl: value, de: value })

/**
 * What the city's live sale listings on the site actually ask, per district:
 * the Domlivo Price Index table.
 *
 * Sits under the `zoneMetrics` table on city pages. Those figures are market
 * research — sourced, periodic, often ranges; these are our own listings, read
 * from the same snapshot as the answer box at the top of the page and the
 * `/data/prices/` downloads, and they link straight to the district catalog. A
 * median over fewer than `MIN_HEADLINE_SAMPLE` flats carries an asterisk and a
 * footnote. The Dataset markup for it lives on the `/info` page itself.
 */
export async function ListingPriceIndexSection({ locale, citySlug }: { locale: string; citySlug: string }) {
  const [snapshot, name, t, tIndex] = await Promise.all([
    fetchPriceIndexSnapshot(),
    fetchCityNameForms(citySlug, locale),
    getTranslations({ locale, namespace: 'ZoneMetrics.listingIndex' }),
    getTranslations({ locale, namespace: 'PriceIndex' }),
  ])
  const city = findIndexCity(snapshot, citySlug)
  const shown = (city?.districts ?? []).filter((r) => r.flats >= MIN_ROW_FLATS)
  if (!snapshot || !city || shown.length < 2) return null
  const country = city.country

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const money = (n: number | null) => (n === null ? '—' : `€${number.format(n)}`)
  const cells = (r: PriceIndexFigures) => [
    loc(number.format(r.listings)),
    loc(money(r.flatPriceFrom)),
    loc(money(r.medianFlatPrice)),
    loc(r.median !== null && !r.reliable ? `${money(r.median)}*` : money(r.median)),
  ]
  const anyLowSample = [city, ...shown].some((r) => r.median !== null && !r.reliable)
  const date = formatBlogDate(new Date(snapshot.computedAt), locale)

  return (
    <PriceTableSection
      locale={locale}
      section={{
        title: loc(t('title', { city: name.base })),
        subtitle: loc(`${t('subtitle', { count: city.listings, min: MIN_ROW_FLATS })} ${t('versusMarket')}`),
        labelHeader: loc(t('district')),
        columns: [loc(t('listings')), loc(t('from')), loc(t('median')), loc(t('medianSqm'))],
        rows: [
          ...shown.map((r) => ({
            _key: r.slug,
            label: loc(resolveLocalizedString(r.title as never, locale) || r.slug),
            cells: cells(r),
            href: `/${country}/${citySlug}/${r.slug}`,
          })),
          { _key: 'city', label: loc(t('wholeCity', { city: name.base })), cells: cells(city), href: `/${country}/${citySlug}` },
        ],
        caption: tIndex('tableCaption', { city: name.base, date, flats: city.count, listings: city.listings }),
        footnote: anyLowSample ? tIndex('lowSampleNote', { min: MIN_HEADLINE_SAMPLE }) : undefined,
        sourceNote: loc(t('note')),
        lastUpdated: snapshot.computedAt,
        methodologyHref: methodologyPath(locale),
      }}
    />
  )
}
