"use client";

import { useTranslations } from 'next-intl'
import { PropertyHomes } from '@/types/propertyHomes'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/lib/catalog/viewMode'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatMoney } from '@/lib/currency/format'
import { convertFromBaseEur } from '@/lib/currency/convert'
import { displayDealLabel, truncateTeaser } from '@/lib/property/cardFormatters'
import { PropertyContactButton } from '@/components/property/PropertyContactModal'
import { PropertyCardGallery } from './PropertyCardGallery'
import { PropertyCardMeta } from './PropertyCardMeta'

const MARKET_POSITION_LABEL_KEY: Record<'below' | 'in' | 'above', 'labelBelow' | 'labelIn' | 'labelAbove'> = {
  below: 'labelBelow',
  in: 'labelIn',
  above: 'labelAbove',
}

const MARKET_POSITION_BADGE_CLASS: Record<'below' | 'in' | 'above', string> = {
  below: 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
  in: 'bg-dark/10 text-dark/70 dark:bg-white/10 dark:text-white/70',
  above: 'bg-amber-600/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
}

function PropertyCard({
  item,
  locale,
  view = 'large',
  fullClickable = true,
  singleImage = false,
  fillHeight = false,
}: {
  item: PropertyHomes
  locale: string
  view?: ViewMode
  fullClickable?: boolean
  /** Show only first image, no slider/gallery (for carousel on mobile to avoid gesture conflict) */
  singleImage?: boolean
  /** Fill parent height for even card alignment in carousel */
  fillHeight?: boolean
}) {
  const {
    name,
    location,
    rate,
    beds,
    baths,
    area,
    slug,
    images,
    price,
    priceUnit,
    status,
    propertyType,
    teaser,
    promotionType,
    discountPercent,
    constructionStage,
    handoverYear,
    handoverQuarter,
    marketPosition,
  } = item

  const isPremium = promotionType === 'premium'
  const { currency: activeCurrency, rates } = useCurrency()
  const tMarketPosition = useTranslations('PropertyMarketPosition')
  const tDealType = useTranslations('Shared.propertyDetail')
  const tCard = useTranslations('Shared.propertyCard')
  const href = item._href ?? `/${locale}/property/${slug}`

  const isList = view === 'list'
  const isSmall = view === 'small'
  const isLarge = !isSmall && !isList

  const cardWrapper = cn(
    'relative rounded-2xl border border-dark/10 dark:border-white/10 duration-300 min-w-0',
    '[&:hover:not(:has(.property-card-overlay:hover))]:shadow-3xl dark:[&:hover:not(:has(.property-card-overlay:hover))]:shadow-white/20',
    isList && 'flex flex-row overflow-hidden items-stretch',
    fillHeight && !isList && 'flex-1 min-h-0 flex flex-col',
    isPremium &&
      'border-primary/25 dark:border-primary/35 bg-primary/[0.04] dark:bg-primary/[0.07] shadow-sm'
  )

  const imageWrapper = cn(
    'overflow-hidden relative shrink-0',
    isList ? 'w-36 sm:w-52 md:w-72 rounded-l-2xl aspect-[16/9]' : 'rounded-t-2xl w-full',
    isLarge && 'aspect-[22/15]',
    isSmall && !isList && 'aspect-[16/10]'
  )

  const imageClass = cn(
    'object-cover',
    isList ? 'rounded-l-2xl' : 'rounded-t-2xl'
  )

  const contentPadding = cn(
    isList && 'px-3 py-2.5 sm:px-4 sm:py-3 flex-1 min-w-0 flex flex-col justify-center',
    isSmall && !isList && 'p-2.5 min-w-0',
    !isList && !isSmall && 'p-6',
    fillHeight && !isList && 'flex-1 min-h-0 flex flex-col justify-between'
  )

  const priceClass = cn(
    'inline-flex items-center justify-center font-semibold rounded-full leading-none',
    isSmall && !isList && 'text-xs px-2 py-1 text-primary bg-primary/10',
    isList && 'h-7 text-sm px-3 bg-primary text-white',
    isLarge && 'h-8 text-base px-4 bg-primary text-white'
  )

  const basePriceEur =
    typeof price === 'number'
      ? price
      : (typeof rate === 'string' && rate.trim() ? Number(String(rate).replace(/[^\d.-]/g, '')) : NaN)
  // Off-plan units and most land are quoted as a rate, and there is no total
  // until a unit is chosen. Show the rate as a rate; do not let it read as the
  // price of the flat, and do not divide it by the area a second time.
  const isRate = priceUnit === 'per-sqm'
  const formattedAmount =
    Number.isFinite(basePriceEur)
      ? formatMoney(convertFromBaseEur(basePriceEur as number, activeCurrency, rates), activeCurrency, locale)
      : ''
  const formattedPrice = formattedAmount
    ? isRate
      ? tCard('pricePerSqmFrom', { amount: formattedAmount })
      : formattedAmount
    : ''

  const numericArea = typeof area === 'number' ? area : NaN
  const pricePerSqm =
    !isRate && Number.isFinite(basePriceEur) && Number.isFinite(numericArea) && numericArea > 0
      ? Math.round((basePriceEur as number) / numericArea)
      : null
  const formattedPricePerSqm =
    pricePerSqm !== null
      ? `${formatMoney(convertFromBaseEur(pricePerSqm, activeCurrency, rates), activeCurrency, locale)} / m²`
      : ''

  const typeLine = propertyType || ''
  const displayLocation = location

  const topBlock = (
    <div
      className={cn(
        'flex flex-col justify-between',
        isList && 'gap-1 mb-1',
        isSmall && !isList && 'gap-1 mb-2',
        isLarge && 'gap-2 mb-3'
      )}
    >
      {/* price + deal type row — €/m² always sits on its own fixed-height line
          below, so a longer price can never wrap it and shift the card layout */}
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          isList && 'justify-start gap-2 sm:gap-3 flex-wrap'
        )}
      >
        <div className="min-w-0 flex items-center gap-2">
          {formattedPrice && (
            <span className={cn(priceClass, 'whitespace-nowrap')}>
              {formattedPrice}
            </span>
          )}
        </div>
        {status && (
          <span
            className={cn(
              'inline-flex items-center rounded-full font-medium shrink-0',
              isList && 'h-7 text-xs px-3 border border-primary/80 text-primary bg-primary/5 leading-none',
              isLarge && 'h-8 text-xs px-3 border border-primary/80 text-primary bg-primary/5 leading-none',
              isSmall && !isList && 'bg-primary text-white text-[11px] px-2 shadow-sm h-5 leading-5 max-w-[7.25rem] min-w-0 overflow-hidden'
            )}
          >
            {isSmall && !isList ? (
              <span className="min-w-0 truncate whitespace-nowrap">
                <span className="sm:hidden">{displayDealLabel(status, tDealType, { compact: true })}</span>
                <span className="hidden sm:inline">{displayDealLabel(status, tDealType, { compact: false })}</span>
              </span>
            ) : (
              displayDealLabel(status, tDealType, { compact: false })
            )}
          </span>
        )}
      </div>

      {/* €/m² line — rendered (empty or not) on large cards so heights stay even */}
      {isLarge && (
        <p className="min-h-4 flex items-center gap-1.5 text-xs leading-4 text-dark/55 dark:text-white/55 font-medium truncate">
          {formattedPricePerSqm}
          {marketPosition && (
            <span
              className={cn(
                'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                MARKET_POSITION_BADGE_CLASS[marketPosition.label]
              )}
              title={tMarketPosition('disclaimer')}
            >
              {tMarketPosition(MARKET_POSITION_LABEL_KEY[marketPosition.label])}
            </span>
          )}
        </p>
      )}

      {/* property type */}
      {typeLine && (
        <p
          className={cn(
            'font-medium text-black/80 dark:text-white/80 truncate',
            isSmall ? 'text-xs' : 'text-sm'
          )}
        >
          {typeLine}
        </p>
      )}

      {/* location */}
      {displayLocation && (
        <p
          className={cn(
            'font-normal text-black/50 dark:text-white/50 truncate',
            isSmall ? 'text-xs' : 'text-sm'
          )}
        >
          {displayLocation}
        </p>
      )}

      {/* property title – min-h reserves 2-line space for even card height */}
      {name && (
        fullClickable ? (
          <h3 className={cn('text-sm md:text-base font-medium text-black dark:text-white line-clamp-2 min-h-[2.5em] hover:text-primary transition-colors')}>
            {name}
          </h3>
        ) : (
          <Link href={href}>
            <h3 className={cn('text-sm md:text-base font-medium text-black dark:text-white line-clamp-2 min-h-[2.5em] hover:text-primary transition-colors')}>
              {name}
            </h3>
          </Link>
        )
      )}
    </div>
  )

  const metaBlock = <PropertyCardMeta view={view} beds={beds} baths={baths} area={area} />

  /**
   * Enquiry CTA. `relative z-20` lifts it over the card-wide link overlay
   * (`z-10`), which otherwise swallows the click and navigates instead.
   * The modal posts to `/api/contact-agent` with this listing's slug, so the
   * Telegram message names the property and carries a link straight to it.
   */
  const requestBlock = (
    <div className={cn('relative z-20', isList ? 'mt-2' : 'mt-3')}>
      <PropertyContactButton
        locale={locale}
        propertySlug={slug}
        propertyTitle={name}
        agentSlug={null}
        agentName={null}
        label={tCard('requestInfo')}
        className={cn(
          'inline-flex w-full items-center justify-center rounded-full border border-primary/40 bg-primary/5 font-semibold text-primary',
          'transition-colors duration-200 hover:bg-primary hover:text-white hover:border-primary cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          isSmall && !isList ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        )}
      />
    </div>
  )

  return (
    <div className={cn('min-w-0 w-full', fillHeight && 'h-full flex flex-col')}>
      <div className={cardWrapper}>
        {fullClickable && (
          <Link
            href={href}
            aria-label={name}
            className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        )}
        <PropertyCardGallery
          images={images}
          name={name}
          slug={slug}
          href={href}
          view={view}
          singleImage={singleImage}
          fullClickable={fullClickable}
          imageWrapper={imageWrapper}
          imageClass={imageClass}
          promotionType={promotionType}
          discountPercent={discountPercent}
          constructionStage={constructionStage}
          handoverYear={handoverYear}
          handoverQuarter={handoverQuarter}
        />
        <div className={contentPadding}>
          {isList ? (
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-between h-full">
              {/* Structured list-row content */}
              <div className="min-w-0">
                {/* top meta row */}
                <div className="flex items-center gap-2 flex-nowrap sm:flex-wrap min-w-0 overflow-hidden">
                  {formattedPrice && (
                    <span className={priceClass}>{formattedPrice}</span>
                  )}
                  {formattedPricePerSqm && (
                    <span className="hidden sm:inline text-xs text-dark/55 dark:text-white/55 font-medium whitespace-nowrap">
                      {formattedPricePerSqm}
                    </span>
                  )}
                  {status && (
                    <span className="inline-flex items-center justify-center rounded-full text-xs px-3 h-7 leading-none border border-primary/80 text-primary bg-primary/5">
                      <span className="min-w-0 truncate whitespace-nowrap">
                        <span className="sm:hidden">{displayDealLabel(status, tDealType, { compact: true })}</span>
                        <span className="hidden sm:inline">{displayDealLabel(status, tDealType, { compact: false })}</span>
                      </span>
                    </span>
                  )}
                  {(!!typeLine || !!displayLocation) && (
                    <span className="flex items-center gap-2 min-w-0 overflow-hidden">
                      {!!typeLine && (
                        <span className="shrink-0 text-xs sm:text-sm text-black/70 dark:text-white/70 truncate max-w-[9rem]">
                          {typeLine}
                        </span>
                      )}
                      {!!displayLocation && (
                        <span className="min-w-0 flex-1 text-xs sm:text-sm text-black/50 dark:text-white/50 truncate whitespace-nowrap">
                          {displayLocation}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* title – line-clamp-2 + min-h for even row height */}
                {name && (
                  fullClickable ? (
                    <h3 className="mt-1 text-sm sm:text-base font-medium text-black dark:text-white line-clamp-2 min-h-[2.5em] hover:text-primary transition-colors">
                      {name}
                    </h3>
                  ) : (
                    <Link href={href}>
                      <h3 className="mt-1 text-sm sm:text-base font-medium text-black dark:text-white line-clamp-2 min-h-[2.5em] hover:text-primary transition-colors">
                        {name}
                      </h3>
                    </Link>
                  )
                )}

                {/* teaser */}
                {teaser && teaser.trim().length > 0 && (
                  <p className="mt-0.5 text-xs sm:text-sm text-black/60 dark:text-white/60 line-clamp-1 sm:line-clamp-2">
                    {truncateTeaser(teaser, 220)}
                  </p>
                )}
              </div>

              {/* stats footer */}
              {metaBlock}
              {requestBlock}
            </div>
          ) : (
            <>
              {topBlock}
              {metaBlock}
              {requestBlock}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertyCard
