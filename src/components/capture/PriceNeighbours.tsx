import { getTranslations } from 'next-intl/server'
import PropertyCard from '@/components/shared/property/PropertyCard'
import { CaptureClickTracker } from '@/components/capture/CaptureClickTracker'
import type { PropertyHomes } from '@/types/propertyHomes'

/**
 * "Similar for less / for more": up to three listings of the same city, type
 * and deal on each side of this one's total price (fetchPriceNeighbours).
 * Below the page's two columns, before the general similar-listings carousel.
 * On a phone each row scrolls sideways, so six cards do not add six screens;
 * the cards show their cover only there, the swipe belongs to the row.
 */
export async function PriceNeighbours({
  locale,
  cheaper,
  pricier,
}: {
  locale: string
  cheaper: PropertyHomes[]
  pricier: PropertyHomes[]
}) {
  if (cheaper.length === 0 && pricier.length === 0) return null
  const t = await getTranslations({ locale, namespace: 'Capture.neighbours' })
  const rows = [
    { key: 'cheaper', title: t('cheaper'), items: cheaper },
    { key: 'pricier', title: t('pricier'), items: pricier },
  ].filter((r) => r.items.length > 0)
  return (
    <CaptureClickTracker
      block="price-neighbours"
      placement="property"
      className="mt-16 pt-12 border-t border-dark/10 dark:border-white/20 space-y-12"
    >
      {rows.map((row) => (
        <section key={row.key} aria-labelledby={`price-neighbours-${row.key}`}>
          <h2
            id={`price-neighbours-${row.key}`}
            className="text-2xl sm:text-3xl font-medium tracking-tight text-dark dark:text-white mb-6"
          >
            {row.title}
          </h2>
          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {row.items.map((item) => (
              <div key={item.slug} className="w-[82%] shrink-0 snap-start sm:w-auto min-w-0 h-full">
                <PropertyCard item={item} locale={locale} fillHeight singleImage />
              </div>
            ))}
          </div>
        </section>
      ))}
    </CaptureClickTracker>
  )
}
