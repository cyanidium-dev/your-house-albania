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

const imageSizes = {
  large: { width: 440, height: 300 },
  small: { width: 280, height: 180 },
  list: { width: 200, height: 140 },
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
}: {
  item: PropertyHomes
  locale: string
  view?: ViewMode
}) {
  const { name, location, rate, beds, baths, area, slug, images, price, currency, status, propertyType, city } = item
  const t = useTranslations('Shared.propertyCard')
  const imageList = images?.length ? images : (images?.[0]?.src ? [images[0]] : [])
  const [imageIndex, setImageIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchActive = useRef(false)
  const currentImage = imageList[imageIndex % (imageList.length || 1)]?.src
  const hasMultipleImages = imageList.length > 1
  const href = `/${locale}/property/${slug}`

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

  const cardWrapper = cn(
    'relative rounded-2xl border border-dark/10 dark:border-white/10 duration-300 min-w-0',
    '[&:hover:not(:has(.property-card-overlay:hover))]:shadow-3xl dark:[&:hover:not(:has(.property-card-overlay:hover))]:shadow-white/20',
    isList && 'flex flex-row overflow-hidden'
  )

  const imageWrapper = cn(
    'overflow-hidden relative shrink-0',
    isList ? 'w-28 sm:w-36 rounded-l-2xl' : 'rounded-t-2xl'
  )

  const imageClass = cn(
    'w-full transition duration-300 delay-75 group-hover/image:brightness-50 group-hover/image:scale-125',
    isList ? 'h-full rounded-l-2xl object-cover min-h-[7rem]' : 'rounded-t-2xl object-cover',
    isSmall && !isList && 'aspect-[16/10]'
  )

  const contentPadding = cn(
    isList && 'p-3 sm:p-4 flex-1 min-w-0 flex flex-col justify-center',
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
    !isSmall && !isList && 'text-base'
  )

  const priceClass = cn(
    'font-normal text-primary rounded-full bg-primary/10',
    isSmall && !isList && 'text-xs px-2 py-1',
    isList && 'text-xs sm:text-sm px-2 py-1',
    !isSmall && !isList && 'text-base px-5 py-2'
  )

  const metaItemClass = cn(
    'flex flex-col font-normal text-black dark:text-white',
    isList && 'gap-0.5 text-xs',
    isSmall && !isList && 'gap-0.5 text-[11px]',
    !isSmall && !isList && 'gap-2 text-sm mobile:text-base'
  )

  const iconSize = isList ? 16 : isSmall ? 14 : 20

  const formattedPrice =
    typeof price === 'number'
      ? `€${price.toLocaleString()}`
      : (rate && rate.trim().length > 0 ? rate : '')

  const typeLine = propertyType || ''
  const displayLocation = location

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    touchActive.current = true
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
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) {
      goNextFromGesture()
    } else {
      goPrevFromGesture()
    }
    e.preventDefault()
  }

  const topBlock = (
    <div
      className={cn(
        'flex flex-col justify-between',
        isList && 'gap-1 mb-2',
        isSmall && !isList && 'gap-1 mb-2',
        !isSmall && !isList && 'gap-2 mb-4'
      )}
    >
      {/* price + deal type row */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          {formattedPrice && (
            <span
              className={cn(
                priceClass,
                'inline-block font-semibold',
                isSmall ? 'text-xs px-2 py-1' : 'text-base px-4 py-1.5'
              )}
            >
              {formattedPrice}
            </span>
          )}
        </div>
        {status && (
          <span className="inline-flex items-center rounded-full bg-primary text-white text-[11px] px-2 py-0.5 shadow-sm shrink-0">
            {displayStatusLabel(status)}
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
        <Link href={href}>
          <h3 className={cn('text-sm md:text-base font-medium text-black dark:text-white line-clamp-2 hover:text-primary transition-colors')}>
            {name}
          </h3>
        </Link>
      )}
    </div>
  )

  const metaBlock = (
    <div className={cn('grid grid-cols-3 w-full min-w-0')}>
      <div className={cn('flex border-e border-black/10 dark:border-white/20 justify-center items-center', isSmall && !isList ? 'flex-row gap-1 py-0.5' : 'flex-col gap-2 py-1', isList && 'gap-0.5 py-0.5', metaItemClass)}>
        <Icon icon="solar:bed-linear" width={iconSize} height={iconSize} className="shrink-0" />
        <span className={cn('truncate max-w-full', isSmall && !isList && 'min-w-0')}>
          {isSmall && !isList ? beds : `${beds} ${t('bedrooms')}`}
        </span>
      </div>
      <div className={cn('flex border-e border-black/10 dark:border-white/20 justify-center items-center', isSmall && !isList ? 'flex-row gap-1 py-0.5' : 'flex-col gap-2 py-1', isList && 'gap-0.5 py-0.5', metaItemClass)}>
        <Icon icon="solar:bath-linear" width={iconSize} height={iconSize} className="shrink-0" />
        <span className={cn('truncate max-w-full', isSmall && !isList && 'min-w-0')}>
          {isSmall && !isList ? baths : `${baths} ${t('bathrooms')}`}
        </span>
      </div>
      <div className={cn('flex justify-center items-center min-w-0', isSmall && !isList ? 'flex-row gap-1 py-0.5' : 'flex-col gap-2 py-1', isList && 'gap-0.5 py-0.5', metaItemClass)}>
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
        <div
          className={cn(imageWrapper, 'relative')}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="property-card-overlay absolute inset-0 z-20 pointer-events-none [&>*]:pointer-events-auto">
            <div className={cn('absolute z-10', isList ? 'top-2 right-2' : 'top-6 right-6', isSmall && !isList && 'top-2 right-2')}>
              <FavoriteButton slug={slug} name={name} variant="overlay" size={isList || isSmall ? 'compact' : 'default'} imageUrl={imageList[0]?.src ?? null} />
            </div>
            {hasMultipleImages && (
              <>
                {/* Левая tappable-зона */}
                <button
                  type="button"
                  aria-label={t('previousImage')}
                  onClick={goPrev}
                  className="absolute inset-y-0 left-0 w-1/3 z-20 flex items-center justify-start px-1 sm:px-2 bg-transparent"
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary/40',
                      'bg-black/20 dark:bg-white/20 text-white hover:bg-black/30 dark:hover:bg-white/30 backdrop-blur-[2px]',
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
                  className="absolute inset-y-0 right-0 w-1/3 z-20 flex items-center justify-end px-1 sm:px-2 bg-transparent"
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary/40',
                      'bg-black/20 dark:bg-white/20 text-white hover:bg-black/30 dark:hover:bg-white/30 backdrop-blur-[2px]',
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
          <Link href={href} className={cn('block group/image', isList && 'h-full')}>
            {currentImage && (
              <Image
                src={currentImage}
                alt={name}
                width={imageSizes[view].width}
                height={imageSizes[view].height}
                className={imageClass}
                unoptimized
              />
            )}
          </Link>
        </div>
        <div className={contentPadding}>
          {topBlock}
          {metaBlock}
        </div>
      </div>
    </div>
  )
}

export default PropertyCard
