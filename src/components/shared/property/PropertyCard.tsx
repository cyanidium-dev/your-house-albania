"use client";

import { useState, useCallback, useRef } from 'react'
import { PropertyHomes } from '@/types/properyHomes'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/lib/catalog/viewMode'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatMoney } from '@/lib/currency/format'
import { convertFromBaseEur } from '@/lib/currency/convert'

const imageSizes = {
  large: { width: 440, height: 300 },
  small: { width: 280, height: 180 },
  // slightly wider, lower image footprint for compact horizontal list rows
  list: { width: 420, height: 236 },
} as const

function displayStatusLabel(status?: string | null): string | null {
  if (!status) return null
  const s = status.toLowerCase().trim()
  if (s === 'sale') return 'For sale'
  if (s === 'rent') return 'For rent'
  if (s === 'short-term' || s === 'shortterm') return 'Short-term rent'
  if (s === 'long-term' || s === 'longterm') return 'Long-term rent'
  return status
}

function displayStatusShortLabel(status?: string | null): string | null {
  const full = displayStatusLabel(status)
  if (!full) return null
  const s = full.toLowerCase()
  if (s.includes('short-term')) return 'Short rent'
  if (s.includes('long-term')) return 'Long rent'
  if (s === 'for rent') return 'Rent'
  return full
}

function displayDealLabel(status?: string | null, opts?: { compact?: boolean }): string | null {
  return opts?.compact ? displayStatusShortLabel(status) : displayStatusLabel(status)
}

function truncateTeaser(text: string, maxChars: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return ''
  if (t.length <= maxChars) return t
  return `${t.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}

function formatPrice(rate: string, price?: number | null, currency?: string | null): string {
  if (rate && rate.trim().length > 0) return rate
  if (typeof price === 'number' && !Number.isNaN(price)) {
    const cur = (currency && currency.trim()) || 'EUR'
    if (cur.toUpperCase() === 'EUR') {
      return `${price.toLocaleString()} €`
    }
    return `${price.toLocaleString()} ${cur}`
  }
  return ''
}

function PropertyCard({
  item,
  locale,
  view = 'large',
  fullClickable = false,
}: {
  item: PropertyHomes
  locale: string
  view?: ViewMode
  fullClickable?: boolean
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
    currency,
    status,
    propertyType,
    city,
    teaser,
  } = item
  const t = useTranslations('Shared.propertyCard')
  const { currency: activeCurrency, rates } = useCurrency()
  const imageList = images?.length ? images : (images?.[0]?.src ? [images[0]] : [])
  const [imageIndex, setImageIndex] = useState(0)
  const [slideOffset, setSlideOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchActive = useRef(false)
  const dragStartX = useRef<number | null>(null)
  const currentImage = imageList[imageIndex % (imageList.length || 1)]?.src
  const hasMultipleImages = imageList.length > 1
  const href = item._href ?? `/${locale}/property/${slug}`

  const goPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImageIndex((i) => (i - 1 + imageList.length) % imageList.length)
  }, [imageList.length])

  const goNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImageIndex((i) => (i + 1) % imageList.length)
  }, [imageList.length])

  const goPrevFromGesture = useCallback(() => {
    setImageIndex((i) => (i - 1 + imageList.length) % imageList.length)
  }, [imageList.length])

  const goNextFromGesture = useCallback(() => {
    setImageIndex((i) => (i + 1) % imageList.length)
  }, [imageList.length])

  const isList = view === 'list'
  const isSmall = view === 'small'
  const isLarge = !isSmall && !isList

  const cardWrapper = cn(
    'relative rounded-2xl border border-dark/10 dark:border-white/10 duration-300 min-w-0',
    '[&:hover:not(:has(.property-card-overlay:hover))]:shadow-3xl dark:[&:hover:not(:has(.property-card-overlay:hover))]:shadow-white/20',
    isList && 'flex flex-row overflow-hidden items-stretch'
  )

  const imageWrapper = cn(
    'overflow-hidden relative shrink-0',
    isList ? 'w-36 sm:w-52 md:w-72 rounded-l-2xl' : 'rounded-t-2xl'
  )

  const imageClass = cn(
    'h-full w-full object-cover',
    isList ? 'rounded-l-2xl aspect-[16/9]' : 'rounded-t-2xl',
    isSmall && !isList && 'aspect-[16/10]'
  )

  const contentPadding = cn(
    isList && 'px-3 py-2.5 sm:px-4 sm:py-3 flex-1 min-w-0 flex flex-col justify-center',
    isSmall && !isList && 'p-2.5 min-w-0',
    !isList && !isSmall && 'p-6'
  )

  const titleClass = cn(
    'font-medium text-black dark:text-white duration-300 group-hover:text-primary',
    isSmall && !isList && 'text-sm',
    isList && 'text-sm sm:text-base',
    !isSmall && !isList && 'text-xl'
  )

  const locationClass = cn(
    'font-normal text-black/50 dark:text-white/50',
    isSmall && !isList && 'text-xs',
    isList && 'text-xs sm:text-sm',
    isLarge && 'text-base'
  )

  const priceClass = cn(
    'inline-flex items-center justify-center font-semibold rounded-full leading-none',
    isSmall && !isList && 'text-xs px-2 py-1 text-primary bg-primary/10',
    isList && 'h-7 text-sm px-3 bg-primary text-white',
    isLarge && 'h-8 text-base px-4 bg-primary text-white'
  )

  const metaItemClass = cn(
    'flex flex-col font-normal text-black dark:text-white',
    isList && 'gap-0.5 text-xs',
    isSmall && !isList && 'gap-0.5 text-[11px]',
    !isSmall && !isList && 'gap-1.5 text-sm mobile:text-base'
  )

  const iconSize = isList ? 16 : isSmall ? 14 : 20

  const basePriceEur =
    typeof price === 'number'
      ? price
      : (typeof rate === 'string' && rate.trim() ? Number(String(rate).replace(/[^\d.-]/g, '')) : NaN)
  const formattedPrice =
    Number.isFinite(basePriceEur)
      ? formatMoney(convertFromBaseEur(basePriceEur as number, activeCurrency, rates), activeCurrency, locale)
      : ''

  const typeLine = propertyType || ''
  const displayLocation = location

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    touchActive.current = true
    dragStartX.current = touch.clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchActive.current || touchStartX.current === null || touchStartY.current === null) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartX.current
    const dy = touch.clientY - touchStartY.current
    // Если вертикальное движение сильнее — отдаём приоритет скроллу страницы
    if (Math.abs(dy) > Math.abs(dx)) {
      touchActive.current = false
      return
    }
    // При выраженном горизонтальном жесте блокируем скролл/клик
    if (Math.abs(dx) > 40) {
      e.preventDefault()
    }
    if (dragStartX.current !== null) {
      const dragDx = touch.clientX - dragStartX.current
      setSlideOffset(dragDx)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchActive.current || touchStartX.current === null || touchStartY.current === null) {
      touchStartX.current = null
      touchStartY.current = null
      touchActive.current = false
      return
    }
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartX.current
    const dy = touch.clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    touchActive.current = false
    setIsDragging(false)
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) {
      setSlideOffset(0)
      return
    }
    if (dx < 0) {
      goNextFromGesture()
    } else {
      goPrevFromGesture()
    }
    setSlideOffset(0)
    e.preventDefault()
  }

  const topBlock = (
    <div
      className={cn(
        'flex flex-col justify-between',
        isList && 'gap-1 mb-1',
        isSmall && !isList && 'gap-1 mb-2',
        isLarge && 'gap-2 mb-3'
      )}
    >
      {/* price + deal type row */}
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          isList && 'justify-start gap-2 sm:gap-3 flex-wrap'
        )}
      >
        <div className="min-w-0">
          {formattedPrice && (
            <span className={priceClass}>
              {formattedPrice}
            </span>
          )}
        </div>
        {status && (
          <span
            className={cn(
              'inline-flex items-center rounded-full font-medium',
              isList && 'h-7 text-xs px-3 border border-primary/80 text-primary bg-primary/5 leading-none',
              isLarge && 'h-8 text-xs px-3 border border-primary/80 text-primary bg-primary/5 leading-none',
              isSmall && !isList && 'bg-primary text-white text-[11px] px-2 shadow-sm h-5 leading-5 max-w-[7.25rem] min-w-0 overflow-hidden'
            )}
          >
            {isSmall && !isList ? (
              <span className="min-w-0 truncate whitespace-nowrap">
                <span className="sm:hidden">{displayDealLabel(status, { compact: true })}</span>
                <span className="hidden sm:inline">{displayDealLabel(status, { compact: false })}</span>
              </span>
            ) : (
              displayDealLabel(status, { compact: false })
            )}
          </span>
        )}
      </div>

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

      {/* property name (no name in small mode) */}
      {!isSmall && name && (
        fullClickable ? (
          <h3 className={cn('text-sm md:text-base font-medium text-black dark:text-white line-clamp-2 hover:text-primary transition-colors')}>
            {name}
          </h3>
        ) : (
          <Link href={href}>
            <h3 className={cn('text-sm md:text-base font-medium text-black dark:text-white line-clamp-2 hover:text-primary transition-colors')}>
              {name}
            </h3>
          </Link>
        )
      )}
    </div>
  )

  const metaBlock = (
    <div
      className={cn(
        'grid grid-cols-3 w-full min-w-0',
        isList && 'mt-1 pt-1.5 border-t border-black/5 dark:border-white/10'
      )}
    >
      <div
        className={cn(
          'flex border-e border-black/10 dark:border-white/20 items-center',
          isSmall && !isList ? 'flex-row gap-1 py-0.5 justify-between' : 'flex-col gap-1.5 py-1 justify-center',
          isList && 'gap-0.5 py-0.5 justify-start',
          metaItemClass
        )}
      >
        <Icon icon="solar:bed-linear" width={iconSize} height={iconSize} className="shrink-0" />
        <span className={cn('truncate max-w-full', isSmall && !isList && 'min-w-0')}>
          {isSmall && !isList ? beds : `${beds} ${t('bedrooms')}`}
        </span>
      </div>
      <div
        className={cn(
          'flex border-e border-black/10 dark:border-white/20 items-center',
          isSmall && !isList ? 'flex-row gap-1 py-0.5 justify-between' : 'flex-col gap-1.5 py-1 justify-center',
          isList && 'gap-0.5 py-0.5 justify-start',
          metaItemClass
        )}
      >
        <Icon icon="solar:bath-linear" width={iconSize} height={iconSize} className="shrink-0" />
        <span className={cn('truncate max-w-full', isSmall && !isList && 'min-w-0')}>
          {isSmall && !isList ? baths : `${baths} ${t('bathrooms')}`}
        </span>
      </div>
      <div
        className={cn(
          'flex items-center min-w-0',
          isSmall && !isList ? 'flex-row gap-1 py-0.5 justify-between' : 'flex-col gap-1.5 py-1 justify-center',
          isList && 'gap-0.5 py-0.5 justify-start',
          metaItemClass
        )}
      >
        <Icon icon="lineicons:arrow-all-direction" width={iconSize} height={iconSize} className="shrink-0" />
        <span className={cn('truncate max-w-full', isSmall && !isList && 'min-w-0')}>
          {area}{t('areaUnit')}
        </span>
      </div>
    </div>
  )

  return (
    <div className="min-w-0 w-full">
      <div className={cardWrapper}>
        {fullClickable && (
          <Link
            href={href}
            aria-label={name}
            className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        )}
        <div
          className={cn(imageWrapper, 'relative')}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="property-card-overlay absolute inset-0 z-20 pointer-events-none [&>*]:pointer-events-auto">
            <div className={cn('absolute z-30', isList ? 'top-2 right-2' : 'top-6 right-6', isSmall && !isList && 'top-2 right-2')}>
              <FavoriteButton slug={slug} name={name} variant="overlay" size={isList || isSmall ? 'compact' : 'default'} imageUrl={imageList[0]?.src ?? null} />
            </div>
            {hasMultipleImages && (
              <>
                {/* Левая tappable-зона */}
                <button
                  type="button"
                  aria-label={t('previousImage')}
                  onClick={goPrev}
                  className="absolute inset-y-0 left-0 w-1/3 z-20 flex items-center justify-start px-1 sm:px-2 bg-transparent cursor-pointer"
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-full transition duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-primary/40',
                      'bg-black/20 dark:bg-white/20 text-white hover:bg-black/35 dark:hover:bg-white/35 backdrop-blur-[2px]',
                      'hover:scale-105',
                      view === 'large' && 'ml-5 p-2',
                      (view === 'small' || view === 'list') && 'ml-1.5 p-1.5',
                      isList && 'ml-2'
                    )}
                  >
                    <Icon icon="solar:alt-arrow-left-linear" width={view === 'large' ? 18 : 14} height={view === 'large' ? 18 : 14} />
                  </span>
                </button>
                {/* Правая tappable-зона */}
                <button
                  type="button"
                  aria-label={t('nextImage')}
                  onClick={goNext}
                  className="absolute inset-y-0 right-0 w-1/3 z-20 flex items-center justify-end px-1 sm:px-2 bg-transparent cursor-pointer"
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-full transition duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-primary/40',
                      'bg-black/20 dark:bg-white/20 text-white hover:bg-black/35 dark:hover:bg-white/35 backdrop-blur-[2px]',
                      'hover:scale-105',
                      view === 'large' && 'mr-5 p-2',
                      (view === 'small' || view === 'list') && 'mr-1.5 p-1.5',
                      isList && 'mr-2'
                    )}
                  >
                    <Icon icon="solar:alt-arrow-right-linear" width={view === 'large' ? 18 : 14} height={view === 'large' ? 18 : 14} />
                  </span>
                </button>
              </>
            )}
            {hasMultipleImages && view === 'large' && (
              <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1 pointer-events-none">
                {imageList.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 rounded-full transition-colors',
                      i === imageIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/60'
                    )}
                    aria-hidden
                  />
                ))}
              </div>
            )}
          </div>
          {fullClickable ? (
            <div className={cn('block group/image h-full')}>
              {imageList.length > 0 && (
                <div className="relative h-full w-full overflow-hidden">
                  <div
                    className={cn(
                      'flex h-full w-full',
                      isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'
                    )}
                    style={{
                      transform: `translateX(calc(${-imageIndex * 100}% + ${slideOffset}px))`,
                    }}
                  >
                    {imageList.map((img, idx) => (
                      <div key={idx} className="relative h-full w-full shrink-0">
                        <Image
                          src={img.src}
                          alt={name}
                          width={imageSizes[view].width}
                          height={imageSizes[view].height}
                          className={imageClass}
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href={href} className={cn('block group/image h-full')}>
            {imageList.length > 0 && (
              <div className="relative h-full w-full overflow-hidden">
                <div
                  className={cn(
                    'flex h-full w-full',
                    isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'
                  )}
                  style={{
                    transform: `translateX(calc(${-imageIndex * 100}% + ${slideOffset}px))`,
                  }}
                >
                  {imageList.map((img, idx) => (
                    <div key={idx} className="relative h-full w-full shrink-0">
                      <Image
                        src={img.src}
                        alt={name}
                        width={imageSizes[view].width}
                        height={imageSizes[view].height}
                        className={imageClass}
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            </Link>
          )}
        </div>
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
                  {status && (
                    <span className="inline-flex items-center justify-center rounded-full text-xs px-3 h-7 leading-none border border-primary/80 text-primary bg-primary/5">
                      <span className="min-w-0 truncate whitespace-nowrap">
                        <span className="sm:hidden">{displayDealLabel(status, { compact: true })}</span>
                        <span className="hidden sm:inline">{displayDealLabel(status, { compact: false })}</span>
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

                {/* title */}
                {name && (
                  fullClickable ? (
                    <h3 className="mt-1 text-sm sm:text-base font-medium text-black dark:text-white truncate hover:text-primary transition-colors">
                      {name}
                    </h3>
                  ) : (
                    <Link href={href}>
                      <h3 className="mt-1 text-sm sm:text-base font-medium text-black dark:text-white truncate hover:text-primary transition-colors">
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
            </div>
          ) : (
            <>
              {topBlock}
              {metaBlock}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertyCard

