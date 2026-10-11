'use client'

import * as React from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Link from '@/components/shared/Link'
import { brandButtonClass } from '@/components/shared/BrandButton'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatMoney } from '@/lib/currency/format'
import { convertFromBaseEur } from '@/lib/currency/convert'
import { cn } from '@/lib/utils'
import type { PropertyHomes } from '@/types/propertyHomes'
import type { MapArea } from './PropertiesMap'

/**
 * The listings of one area bubble: listings whose agency did not publish the
 * address, grouped by district instead of standing as pins on made-up spots.
 * A strip of small cards (a tap opens the listing window) and a link to the
 * catalogue filtered to the district.
 */
export function MapAreaSheet({
  area,
  items,
  locale,
  seeAllHref,
  variant,
  onPick,
  onClose,
}: {
  area: MapArea
  /** null while loading. */
  items: PropertyHomes[] | null
  locale: string
  seeAllHref: string | null
  variant: 'sheet' | 'panel'
  onPick: (item: PropertyHomes) => void
  onClose: () => void
}) {
  const t = useTranslations('Shared.map')
  const tCard = useTranslations('Shared.propertyCard')
  const { currency, rates } = useCurrency()
  const isSheet = variant === 'sheet'
  const name = area.name || t('areaFallbackName')

  return (
    <div
      role="dialog"
      aria-label={t('areaTitle', { name, count: area.count })}
      className={cn(
        'absolute z-20 overflow-hidden bg-white text-dark shadow-2xl dark:bg-dark dark:text-white',
        isSheet
          ? 'inset-x-0 bottom-0 rounded-t-3xl pb-[var(--app-bottom-inset,0px)] sm:inset-x-auto sm:left-1/2 sm:w-[520px] sm:-translate-x-1/2'
          : 'inset-x-3 bottom-3 rounded-2xl border border-dark/10 dark:border-white/15'
      )}
    >
      <div className="flex items-start gap-3 px-4 pb-2 pt-4">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-tight">≈ {t('areaTitle', { name, count: area.count })}</p>
          <p className="mt-1 text-xs leading-snug text-dark/60 dark:text-white/60">{t('areaNote')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={tCard('closePreview')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark/5 text-lg leading-none dark:bg-white/10"
        >
          ×
        </button>
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items === null
          ? Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-[168px] w-[150px] shrink-0 animate-pulse rounded-xl bg-dark/10 dark:bg-white/10" />
            ))
          : items.map((item) => {
              const amount =
                typeof item.price === 'number' && item.price > 0
                  ? formatMoney(convertFromBaseEur(item.price, currency, rates), currency, locale)
                  : ''
              // Off-plan units are quoted per m²; "€1,300" alone read as the
              // price of the flat.
              const price = !amount
                ? tCard('priceOnRequest')
                : item.priceUnit === 'per-sqm'
                  ? tCard('pricePerSqmFrom', { amount })
                  : amount
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => onPick(item)}
                  className="w-[150px] shrink-0 snap-start overflow-hidden rounded-xl border border-dark/10 text-left transition-colors hover:border-primary dark:border-white/15"
                >
                  <div className="relative h-[96px] w-full bg-dark/5 dark:bg-white/10">
                    {item.images?.[0]?.src ? (
                      <Image src={item.images[0].src} alt={item.name || tCard('propertyFallback')} fill sizes="150px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="space-y-0.5 p-2">
                    <p className="text-sm font-semibold leading-tight">{price}</p>
                    <p className="line-clamp-2 text-[11px] leading-snug text-dark/70 dark:text-white/70">{item.name}</p>
                  </div>
                </button>
              )
            })}
      </div>

      {seeAllHref ? (
        <div className="px-4 pb-4">
          <Link href={seeAllHref} className={brandButtonClass('primary', 'w-full', 'sm')}>
            {t('areaSeeAll', { name, count: area.count })}
          </Link>
        </div>
      ) : null}
    </div>
  )
}
