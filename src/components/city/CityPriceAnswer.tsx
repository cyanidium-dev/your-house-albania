import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { fetchCityCountrySlugByCitySlug, fetchCityPriceBands } from '@/lib/sanity/client'
import { catalogFilterPath } from '@/lib/routes/catalog'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import type { FlatPriceBand } from '@/lib/catalog/listingPriceSummary'

/** A band of two flats is an anecdote. */
const MIN_BAND_FLATS = 5
const MAX_DISTRICTS = 4

type Props = {
  locale: string
  citySlug: string
  cityLabel: string
}

/**
 * The first thing under the city page's headline: what a square metre asks
 * here, as a 20–80% band and a median, for the whole city, for new builds
 * against completed stock, and for the largest districts. Computed from the
 * live sale listings every hour, so the page carries a current, quotable
 * answer to "real prices in {city} {year}" before any table.
 *
 * Renders nothing for a city with too few priced flats: a band of three
 * listings would mislead more than it informs.
 */
export async function CityPriceAnswer({ locale, citySlug, cityLabel }: Props) {
  const [bands, country, t] = await Promise.all([
    fetchCityPriceBands(citySlug),
    fetchCityCountrySlugByCitySlug(citySlug),
    getTranslations({ locale, namespace: 'ZoneMetrics.priceAnswer' }),
  ])
  if (!bands || !country || bands.city.pricedCount < MIN_BAND_FLATS * 2) return null

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const range = (b: FlatPriceBand) =>
    b.p20 !== null && b.p80 !== null ? t('range', { from: number.format(b.p20), to: number.format(b.p80) }) : null
  const line = (b: FlatPriceBand) => {
    const r = range(b)
    if (!r || b.median === null) return null
    return { range: r, median: t('median', { value: number.format(b.median) }), flats: t('flats', { count: b.pricedCount }) }
  }

  const rows: Array<{ key: string; label: string; href?: string; band: FlatPriceBand }> = [
    { key: 'city', label: t('wholeCity', { city: cityLabel }), band: bands.city },
    { key: 'completed', label: t('completed'), band: bands.completed },
    { key: 'newBuild', label: t('newBuild'), band: bands.newBuild },
    ...bands.districts
      .filter((d) => d.pricedCount >= MIN_BAND_FLATS)
      .slice(0, MAX_DISTRICTS)
      .map((d) => ({
        key: d.districtSlug,
        label: resolveLocalizedString(d.districtTitle as never, locale) || d.districtSlug,
        href: catalogFilterPath({ locale, city: citySlug, district: d.districtSlug, country, trustedCityCountrySlug: country }),
        band: d,
      })),
  ].filter((r) => r.band.pricedCount >= MIN_BAND_FLATS)

  const asOf = new Date()
  const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(asOf)
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(asOf)

  return (
    <section className="pt-10 md:pt-14" aria-labelledby="city-price-answer-heading">
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <div className="rounded-2xl border border-dark/10 bg-dark/[0.03] p-6 dark:border-white/10 dark:bg-white/[0.04] md:p-8">
          <h2 id="city-price-answer-heading" className="font-display text-2xl font-semibold text-dark dark:text-white md:text-3xl">
            {t('title', { city: cityLabel, month })}
          </h2>
          <p className="mt-2 max-w-3xl text-base text-dark/70 dark:text-white/70">
            {t('intro', { count: bands.city.pricedCount, date })}
          </p>
          <dl className="mt-5 grid gap-x-8 gap-y-3 md:grid-cols-2">
            {rows.map((r) => {
              const l = line(r.band)
              if (!l) return null
              return (
                <div key={r.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-dark/10 pb-3 dark:border-white/10">
                  <dt className="text-base font-medium text-dark dark:text-white">
                    {r.href ? (
                      <Link href={r.href} className="underline-offset-4 hover:text-primary hover:underline">
                        {r.label}
                      </Link>
                    ) : (
                      r.label
                    )}
                  </dt>
                  <dd className="text-right text-base text-dark dark:text-white">
                    <span className="font-semibold tabular-nums">{l.range}</span>
                    <span className="ml-2 text-sm text-dark/60 dark:text-white/60">
                      {l.median} · {l.flats}
                    </span>
                  </dd>
                </div>
              )
            })}
          </dl>
          <p className="mt-4 text-sm text-dark/55 dark:text-white/55">{t('note')}</p>
        </div>
      </div>
    </section>
  )
}
