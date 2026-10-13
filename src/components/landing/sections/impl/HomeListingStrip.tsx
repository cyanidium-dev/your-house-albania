import Image from 'next/image'
import Link from '@/components/shared/Link'
import { getTranslations } from 'next-intl/server'
import { fetchHomeTopOffers } from '@/lib/sanity/queries/home'
import { fetchCatalogInventorySummary } from '@/lib/sanity/queries/catalog'
import { mapCatalogPropertyToCard } from '@/lib/sanity/propertyAdapter'
import { formatMoney } from '@/lib/currency/format'
import { catalogPath } from '@/lib/routes/catalog'
import { PriceText } from '@/components/shared/PriceText'
import type { CatalogProperty } from '@/types/catalog'
import type { PropertyHomes } from '@/types/propertyHomes'

const STRIP_SIZE = 6

/**
 * Six real listings inside the homepage hero, on phones only.
 *
 * Three quarters of the phone visitors of /ru never scrolled past the first
 * screen (Clarity, 30 days to 2026-10-13). They come from Telegram and
 * Instagram links expecting flats and got a photograph, a headline and a
 * search form: not one listing until the second screen. The strip puts
 * prices and photos inside the first one, with the size of the catalogue as
 * the line above it. Tablets and desktops already show listings above the
 * fold and are unchanged.
 *
 * Promoted listings first, topped up with the newest, photos only: a card
 * without a picture would be the first impression of the catalogue.
 */
export default async function HomeListingStrip({ locale }: { locale: string }) {
  const [promoted, newest, summary, t, tCard] = await Promise.all([
    fetchHomeTopOffers('popular', STRIP_SIZE * 2),
    fetchHomeTopOffers('new', STRIP_SIZE * 2),
    fetchCatalogInventorySummary({ deal: 'sale' }),
    getTranslations('Home.heroStrip'),
    getTranslations('Shared.propertyCard'),
  ])

  const seen = new Set<string>()
  const cards: PropertyHomes[] = []
  for (const p of [...(promoted ?? []), ...(newest ?? [])]) {
    if (cards.length >= STRIP_SIZE) break
    if (!p?._id || seen.has(p._id)) continue
    const card = mapCatalogPropertyToCard(p as CatalogProperty, locale)
    if (!card.images?.[0]?.src) continue
    seen.add(p._id)
    cards.push(card)
  }
  if (cards.length < 3) return null

  const allHref = catalogPath(locale)

  return (
    <div className="order-6 mt-6 -mx-5 md:hidden">
      <div className="flex items-baseline justify-between gap-3 px-5">
        {summary && summary.count > 0 ? (
          <p className="min-w-0 text-sm font-semibold text-white">
            {t('summary', {
              count: summary.count,
              fromPrice: summary.fromPrice ? formatMoney(summary.fromPrice, 'EUR', locale) : '',
            })}
          </p>
        ) : null}
        <Link
          href={allHref}
          className="shrink-0 text-sm font-semibold text-white underline-offset-4 hover:underline"
        >
          {t('all')} <span aria-hidden>→</span>
        </Link>
      </div>
      <ul
        aria-label={t('label')}
        className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 scroll-px-5 [text-shadow:none]"
      >
        {cards.map((card) => {
          const href = card._href ?? `/${locale}/property/${card.slug}`
          const image = card.images[0]
          const place = card.district || card.city || card.location
          return (
            <li key={card.slug} className="w-40 shrink-0 snap-start">
              <Link
                href={href}
                className="block overflow-hidden rounded-2xl bg-white text-dark shadow-lg ring-1 ring-black/5 dark:bg-dark dark:text-white dark:ring-white/10"
              >
                <div className="relative aspect-[4/3] bg-dark/5 dark:bg-white/5">
                  <Image src={image.src} alt={card.name} fill sizes="160px" className="object-cover" />
                </div>
                <div className="px-3 pb-3 pt-2">
                  <PriceText
                    amountEur={typeof card.price === 'number' ? card.price : null}
                    priceUnit={card.priceUnit}
                    locale={locale}
                    className="block truncate text-[15px] font-bold leading-tight"
                  />
                  <p className="mt-1 truncate text-xs text-dark/60 dark:text-white/60">
                    {[
                      card.beds > 0 ? tCard('bedroomsCount', { count: card.beds }) : null,
                      card.area > 0 ? `${card.area} ${tCard('areaUnit')}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {place ? (
                    <p className="truncate text-xs text-dark/60 dark:text-white/60">{place}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
