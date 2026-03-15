"use client";

import { useState, useCallback } from 'react'
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

function PropertyCard({
  item,
  locale,
  view = 'large',
}: {
  item: PropertyHomes
  locale: string
  view?: ViewMode
}) {
  const { name, location, rate, beds, baths, area, slug, images } = item
  const t = useTranslations('Shared.propertyCard')
  const imageList = images?.length ? images : (images?.[0]?.src ? [images[0]] : [])
  const [imageIndex, setImageIndex] = useState(0)
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

  const topBlock = (
    <div
      className={cn(
        'flex flex-col mobile:flex-row justify-between',
        isList && 'flex-row gap-2 mobile:gap-0 mb-2',
        isSmall && !isList && 'gap-1 mb-2',
        !isSmall && !isList && 'gap-5 mobile:gap-0 mb-6'
      )}
    >
      <div className="min-w-0">
        <Link href={href}>
          <h3 className={cn(titleClass, 'line-clamp-2')}>{name}</h3>
        </Link>
        <p className={cn(locationClass, 'truncate')}>{location}</p>
      </div>
      <div className={cn(isList && 'shrink-0')}>
        <span className={cn(priceClass, 'inline-block')}>${rate}</span>
      </div>
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
        <div className={cn(imageWrapper, 'relative')}>
          <div className="property-card-overlay absolute inset-0 z-20 pointer-events-none [&>*]:pointer-events-auto">
            <div className={cn('absolute z-10', isList ? 'top-2 left-2' : 'top-6 left-6', isSmall && !isList && 'top-1.5 left-1.5')}>
              <FavoriteButton slug={slug} name={name} variant="overlay" size={isList || isSmall ? 'compact' : 'default'} imageUrl={imageList[0]?.src ?? null} />
            </div>
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  aria-label={t('previousImage')}
                  onClick={goPrev}
                  className={cn(
                    'absolute top-1/2 z-20 -translate-y-1/2 rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary/40',
                    'bg-black/20 dark:bg-white/20 text-white hover:bg-black/30 dark:hover:bg-white/30 backdrop-blur-[2px]',
                    view === 'large' && 'left-6 p-2',
                    (view === 'small' || view === 'list') && 'left-1.5 p-1.5',
                    isList && 'left-2'
                  )}
                >
                  <Icon icon="solar:alt-arrow-left-linear" width={view === 'large' ? 18 : 14} height={view === 'large' ? 18 : 14} />
                </button>
                <button
                  type="button"
                  aria-label={t('nextImage')}
                  onClick={goNext}
                  className={cn(
                    'absolute top-1/2 z-20 -translate-y-1/2 rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary/40',
                    'bg-black/20 dark:bg-white/20 text-white hover:bg-black/30 dark:hover:bg-white/30 backdrop-blur-[2px]',
                    view === 'large' && 'right-6 p-2',
                    (view === 'small' || view === 'list') && 'right-1.5 p-1.5',
                    isList && 'right-2'
                  )}
                >
                  <Icon icon="solar:alt-arrow-right-linear" width={view === 'large' ? 18 : 14} height={view === 'large' ? 18 : 14} />
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
