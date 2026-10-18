import Link from "@/components/shared/Link";
import { getTranslations } from 'next-intl/server'
import { fetchPriceIndexSnapshot } from '@/lib/sanity/client'
import { catalogFilterPath } from '@/lib/routes/catalog'
import { resolveLocalizedString } from '@/lib/sanity/localized'
import { CONTAINER } from '@/components/shared/layout'
import { findIndexCity, type PriceIndexFigures } from '@/lib/priceIndex/snapshot'
import { methodologyPath } from '@/lib/priceIndex/publish'

/** A band of two flats is an anecdote: below this a row is left out altogether. */
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
 * against completed stock, and for the largest districts. The Domlivo Price
 * Index snapshot (`lib/priceIndex`), dated, with a link to the methodology,
 * so the page carries the one quotable figure for the city before any table.
 *
 * A row under the index's headline sample (30 flats) states its size instead
 * of a band ("too little data: 11 flats"); districts that small are left to
 * the table further down. Renders nothing for a city with too few priced
 * flats to say anything at all.
 */
export async function CityPriceAnswer({ locale, citySlug, cityLabel }: Props) {
  const [snapshot, t, tIndex] = await Promise.all([
    fetchPriceIndexSnapshot(),
    getTranslations({ locale, namespace: 'ZoneMetrics.priceAnswer' }),
    getTranslations({ locale, namespace: 'PriceIndex' }),
  ])
  const city = findIndexCity(snapshot, citySlug)
  if (!snapshot || !city || city.count < MIN_BAND_FLATS * 2) return null
  const country = city.country

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const line = (b: PriceIndexFigures) => {
    if (!b.reliable) return { lowSample: tIndex('lowSample', { count: b.count }) }
    if (b.p20 === null || b.p80 === null || b.median === null) return null
    return {
      range: t('range', { from: number.format(b.p20), to: number.format(b.p80) }),
      median: t('median', { value: number.format(b.median) }),
      flats: t('flats', { count: b.count }),
    }
  }

  const rows: Array<{ key: string; label: string; href?: string; band: PriceIndexFigures }> = [
    { key: 'city', label: t('wholeCity', { city: cityLabel }), band: city },
    { key: 'completed', label: t('completed'), band: city.completed },
    { key: 'newBuild', label: t('newBuild'), band: city.newBuild },
    ...city.districts
      .filter((d) => d.reliable)
      .slice(0, MAX_DISTRICTS)
      .map((d) => ({
        key: d.slug,
        label: resolveLocalizedString(d.title as never, locale) || d.slug,
        href: catalogFilterPath({ locale, city: citySlug, district: d.slug, country, trustedCityCountrySlug: country }),
        band: d as PriceIndexFigures,
      })),
  ].filter((r) => r.band.count >= MIN_BAND_FLATS)

  const asOf = new Date(snapshot.computedAt)
  const month = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(asOf)
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(asOf)

  return (
    <section className="pt-10 md:pt-14" aria-labelledby="city-price-answer-heading">
      <div className={CONTAINER}>
        <div className="rounded-2xl border border-dark/10 bg-dark/[0.03] p-6 dark:border-white/10 dark:bg-white/[0.04] md:p-8">
          <h2 id="city-price-answer-heading" className="font-display text-2xl font-semibold text-dark dark:text-white md:text-3xl">
            {t('title', { city: cityLabel, month })}
          </h2>
          <p className="mt-2 max-w-3xl text-base text-dark/70 dark:text-white/70">
            {t('intro', { count: city.count, date })}
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
                    {'lowSample' in l ? (
                      <span className="text-sm text-dark/60 dark:text-white/60">{l.lowSample}</span>
                    ) : (
                      <>
                        <span className="font-semibold tabular-nums">{l.range}</span>
                        <span className="ml-2 text-sm text-dark/60 dark:text-white/60">
                          {l.median} · {l.flats}
                        </span>
                      </>
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
          <p className="mt-4 text-sm text-dark/55 dark:text-white/55">
            {t('note')}{' '}
            <Link href={methodologyPath(locale)} className="underline underline-offset-2 hover:text-primary">
              {tIndex('methodologyLink')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
