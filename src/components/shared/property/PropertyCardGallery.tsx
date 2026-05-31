"use client";

import { useState, useCallback, useRef } from 'react'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/lib/catalog/viewMode'
import { PropertyBadges } from './PropertyBadges'

export function PropertyCardGallery({
  images,
  name,
  slug,
  href,
  view,
  singleImage,
  fullClickable,
  imageWrapper,
  imageClass,
  promotionType,
  discountPercent,
}: {
  images: { src: string }[]
  name: string
  slug: string
  href: string
  view: ViewMode
  singleImage: boolean
  fullClickable: boolean
  imageWrapper: string
  imageClass: string
  promotionType?: 'premium' | 'top' | 'sale'
  discountPercent?: number
}) {
  const t = useTranslations('Shared.propertyCard')

  const isList = view === 'list'
  const isSmall = view === 'small'

  const imageList = images?.length ? images : (images?.[0]?.src ? [images[0]] : [])
  const [imageIndex, setImageIndex] = useState(0)
  const [slideOffset, setSlideOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchActive = useRef(false)
  const dragStartX = useRef<number | null>(null)
  const hasMultipleImages = imageList.length > 1 && !singleImage
  const displayImages = singleImage ? imageList.slice(0, 1) : imageList

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

  return (
    <div
      className={cn(imageWrapper, 'relative')}
      onTouchStart={singleImage ? undefined : handleTouchStart}
      onTouchMove={singleImage ? undefined : handleTouchMove}
      onTouchEnd={singleImage ? undefined : handleTouchEnd}
    >
      <div className="property-card-overlay absolute inset-0 z-20 pointer-events-none [&>*]:pointer-events-auto">
        <PropertyBadges promotionType={promotionType} discountPercent={discountPercent} view={view} />
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
        <div className={cn('block group/image h-full w-full')}>
          {displayImages.length > 0 && (
            <div className="relative h-full w-full overflow-hidden">
              <div
                className={cn(
                  'flex h-full w-full',
                  !singleImage && isDragging && 'transition-none',
                  !singleImage && !isDragging && 'transition-transform duration-300 ease-out'
                )}
                style={
                  singleImage
                    ? undefined
                    : { transform: `translateX(calc(${-imageIndex * 100}% + ${slideOffset}px))` }
                }
              >
                {displayImages.map((img, idx) => (
                  <div key={idx} className="relative h-full w-full shrink-0">
                    <Image
                      src={img.src}
                      alt={name}
                      fill
                      sizes={isList ? '208px' : isSmall ? '(min-width: 640px) 50vw, 280px' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
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
        <Link href={href} className={cn('block group/image h-full w-full')}>
        {displayImages.length > 0 && (
          <div className="relative h-full w-full overflow-hidden">
            <div
              className={cn(
                'flex h-full w-full',
                !singleImage && isDragging && 'transition-none',
                !singleImage && !isDragging && 'transition-transform duration-300 ease-out'
              )}
              style={
                singleImage
                  ? undefined
                  : { transform: `translateX(calc(${-imageIndex * 100}% + ${slideOffset}px))` }
              }
            >
              {displayImages.map((img, idx) => (
                <div key={idx} className="relative h-full w-full shrink-0">
                  <Image
                    src={img.src}
                    alt={name}
                    fill
                    sizes={isList ? '208px' : isSmall ? '(min-width: 640px) 50vw, 280px' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
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
  )
}
