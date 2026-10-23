"use client";

import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { SpriteIcon } from "@/components/shared/SpriteIcon";
import Image from 'next/image'
import Link from "@/components/shared/Link";
import { useTranslations } from 'next-intl'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { useNearViewport } from '@/hooks/useNearViewport'
import { PropertyContactButton } from '@/components/property/PropertyContactModal'
import { cn } from '@/lib/utils'
import { brandButtonClass } from '@/components/shared/BrandButton'
import type { ViewMode } from '@/lib/catalog/viewMode'
import { PropertyBadges } from './PropertyBadges'
import { withImageSeoName } from '@/lib/images/propertyImageUrl'

/**
 * The full-screen viewer is code for a tap that most visits never make; it
 * loads when the expand button is pointed at, touched or focused, and the
 * click then finds it ready.
 */
const loadLightbox = () => import('@/components/shared/ImageLightbox')
const ImageLightbox = dynamic(() => loadLightbox().then((m) => m.ImageLightbox), { ssr: false })
const preloadLightbox = () => {
  void loadLightbox()
}

/**
 * Photo controls: one size and one inset per card so they line up on the
 * photo's edges (favourite top right, expand bottom right, arrows mid-height,
 * all on the same vertical). Compact cards 32px at 8px, large cards 40px at
 * 16px. Favourite and expand share a solid ground; the arrows stay glass.
 */
const PHOTO_SOLID =
  'bg-white/90 text-dark/75 shadow-sm backdrop-blur-sm hover:bg-white dark:bg-dark/80 dark:text-white/85 dark:hover:bg-dark'
const PHOTO_GLASS =
  'bg-black/35 text-white shadow-sm ring-1 ring-inset ring-white/20 backdrop-blur-sm hover:bg-black/50'

export function PropertyCardGallery({
  images,
  name,
  alt,
  imageSeoName,
  slug,
  href,
  view,
  singleImage,
  imageSizes: imageSizesProp,
  fullClickable,
  imageWrapper,
  imageClass,
  promotionType,
  constructionStage,
  handoverYear,
  handoverQuarter,
  discountPercent,
  locale,
  contactLabel,
  stats,
}: {
  images: { src: string }[]
  name: string
  /** Localised title plus the place — see lib/property/propertyCardImages. Falls back to `name`. */
  alt?: string
  /**
   * Locale-independent file name for the photos ("apartment-1-1-plazh-durres").
   * Applied here rather than upstream: the card receives every gallery URL as a
   * prop, and naming them all in the payload would cost more than it earns.
   */
  imageSeoName?: string
  slug: string
  href: string
  view: ViewMode
  singleImage: boolean
  imageSizes?: string
  fullClickable: boolean
  imageWrapper: string
  imageClass: string
  promotionType?: 'premium' | 'top' | 'sale'
  constructionStage?: 'off-plan' | 'under-construction' | 'completed'
  handoverYear?: number
  handoverQuarter?: number
  discountPercent?: number
  /** With `contactLabel`, puts the enquiry button inside the full-screen viewer. */
  locale?: string
  contactLabel?: string
  /** "47 views · 5 saved", shown from a threshold (see CARD_STATS_MIN_*). */
  stats?: { views?: number; saves?: number; label: string }
}) {
  const t = useTranslations('Shared.propertyCard')
  const tLightbox = useTranslations('Shared.lightbox')

  const isList = view === 'list'
  const isSmall = view === 'small'
  const isLarge = !isList && !isSmall
  const ctrlSize = isLarge ? 'size-10' : 'size-8'
  const ctrlIcon = isLarge ? 20 : 16

  const imageAlt = alt?.trim() || name
  const imageList = (images?.length ? images : (images?.[0]?.src ? [images[0]] : [])).map((img, idx) =>
    imageSeoName ? { ...img, src: withImageSeoName(img.src, imageSeoName, idx + 1) } : img
  )
  const [imageIndex, setImageIndex] = useState(0)
  const [slideOffset, setSlideOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchActive = useRef(false)
  const dragStartX = useRef<number | null>(null)
  const hasMultipleImages = imageList.length > 1 && !singleImage
  const displayImages = singleImage ? imageList.slice(0, 1) : imageList
  /**
   * A card carousel used to put every photograph of the listing in the markup,
   * and a listing page holds two dozen cards: 283 `<img>` tags, 422 KB of
   * `srcset` strings — over half the HTML document, for slides nobody had
   * swiped to. Only the photographs a swipe away are mounted (`slideTrack`
   * below shows how the strip still lines up).
   *
   * The next slide's photograph waits, too, until the card is near the
   * screen. Server-rendered, it sat in every card, and the browser's lazy
   * loading fetched it for the first half-dozen cards straight away —
   * photographs nobody sees until they swipe, downloading alongside the
   * page's hero (Lighthouse mobile, 2026-10-10). The card now arrives with
   * its cover alone and adds the neighbour as it scrolls within reach.
   */
  const rootRef = useRef<HTMLDivElement>(null)
  const nearViewport = useNearViewport(rootRef, hasMultipleImages)
  const isSlideNearby = (idx: number) =>
    idx === imageIndex || (nearViewport && Math.abs(idx - imageIndex) <= 1)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  // Photos that failed to load: the slide shows the no-photo plate instead of
  // an empty box that reads as a broken page.
  const [broken, setBroken] = useState<Set<number>>(() => new Set())
  const markBroken = useCallback((idx: number) => {
    setBroken((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)))
  }, [])

  /**
   * The whole card is a link, and on `fullClickable` cards an invisible anchor
   * covers it — so opening the photo has to claim the event outright, not just
   * stop it bubbling to a parent handler.
   */
  const openLightbox = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLightboxOpen(true)
  }, [])
  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

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

  const imageSizes = imageSizesProp ?? (isList
    ? '208px'
    : isSmall
      ? '(min-width: 640px) 50vw, 280px'
      : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw')

  /**
   * The strip of photographs. Only the slides that hold a photograph are in
   * the DOM, each placed at its own offset (`left: idx × 100%`), so moving the
   * strip by `-imageIndex × 100%` shows the same slide the old row of
   * full-width flex boxes did. That row kept an empty box for every photo of
   * the listing — ten or so per card, two hundred elements on a listing page
   * that the browser laid out and React hydrated for nothing.
   */
  // No photograph yet (or none that loads): a calm plate that says so,
  // instead of an empty box (owner, 2026-10-22).
  const noPhotoPlate = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent text-dark/50 dark:from-primary/25 dark:via-primary/10 dark:text-white/55">
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px] text-primary/20 dark:text-primary/30"
      />
      <SpriteIcon icon="ph:camera-slash" width={isSmall || isList ? 22 : 28} height={isSmall || isList ? 22 : 28} className="relative" aria-hidden />
      <span className={cn('relative font-medium', isSmall || isList ? 'text-xs' : 'text-sm')}>{t('noPhoto')}</span>
    </div>
  )

  const slideTrack =
    displayImages.length > 0 ? (
      <div className="relative h-full w-full overflow-hidden">
        <div
          className={cn(
            'relative h-full w-full',
            !singleImage && isDragging && 'transition-none',
            !singleImage && !isDragging && 'transition-transform duration-300 ease-out'
          )}
          style={
            singleImage
              ? undefined
              : { transform: `translateX(calc(${-imageIndex * 100}% + ${slideOffset}px))` }
          }
        >
          {displayImages.map((img, idx) =>
            isSlideNearby(idx) ? (
              <div key={idx} className="absolute inset-y-0 w-full" style={{ left: `${idx * 100}%` }}>
                {broken.has(idx) ? (
                  noPhotoPlate
                ) : (
                  <Image src={img.src} alt={imageAlt} fill sizes={imageSizes} className={imageClass} onError={() => markBroken(idx)} />
                )}
              </div>
            ) : null
          )}
        </div>
      </div>
    ) : (
      <div className="relative h-full w-full">{noPhotoPlate}</div>
    )

  return (
    <div
      ref={rootRef}
      className={cn(imageWrapper, 'relative')}
      onTouchStart={singleImage ? undefined : handleTouchStart}
      onTouchMove={singleImage ? undefined : handleTouchMove}
      onTouchEnd={singleImage ? undefined : handleTouchEnd}
    >
      <div className="property-card-overlay absolute inset-0 z-20 pointer-events-none [&>*]:pointer-events-auto">
        <PropertyBadges
          promotionType={promotionType}
          discountPercent={discountPercent}
          constructionStage={constructionStage}
          handoverYear={handoverYear}
          handoverQuarter={handoverQuarter}
          view={view}
        />
        {stats && (stats.views || stats.saves) ? (
          <span
            className={cn(
              // `!`: the overlay's `[&>*]:pointer-events-auto` would otherwise win and
              // turn the badge into a dead spot over the card's link (Clarity, 18.10).
              'pointer-events-none! absolute z-30 inline-flex items-center gap-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold leading-5 text-white backdrop-blur-sm',
              // centred on the expand button's row: 24px badge, 32/40px button
              isLarge ? 'bottom-6 left-4' : 'bottom-3 left-2',
            )}
            title={stats.label}
          >
            {/* Text, not aria-label: a plain span may not carry one, and
                Lighthouse's agentic-browsing check failed on it (24.10). */}
            <span className="sr-only">{stats.label}</span>
            {stats.views ? (
              <span className="inline-flex items-center gap-1" aria-hidden>
                <Icon icon="ph:eye" width={13} height={13} />
                {stats.views}
              </span>
            ) : null}
            {stats.saves ? (
              <span className="inline-flex items-center gap-1" aria-hidden>
                <Icon icon="ph:heart" width={13} height={13} />
                {stats.saves}
              </span>
            ) : null}
          </span>
        ) : null}
        <div className={cn('absolute z-30', isLarge ? 'top-4 right-4' : 'top-2 right-2')}>
          <FavoriteButton slug={slug} name={name} variant="overlay" size={isList || isSmall ? 'compact' : 'default'} imageUrl={imageList[0]?.src ?? null} />
        </div>
        {hasMultipleImages && (
          <>
            {/* Левая tappable-зона */}
            <button
              type="button"
              aria-label={t('previousImage')}
              onClick={goPrev}
              className={cn('absolute inset-y-0 left-0 w-1/3 z-20 flex items-center justify-start bg-transparent cursor-pointer', isLarge ? 'px-4' : 'px-2')}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full transition duration-200 ease-out',
                  PHOTO_GLASS,
                  ctrlSize,
                )}
              >
                <SpriteIcon icon="solar:alt-arrow-left-linear" width={ctrlIcon} height={ctrlIcon} />
              </span>
            </button>
            {/* Правая tappable-зона */}
            <button
              type="button"
              aria-label={t('nextImage')}
              onClick={goNext}
              className={cn('absolute inset-y-0 right-0 w-1/3 z-20 flex items-center justify-end bg-transparent cursor-pointer', isLarge ? 'px-4' : 'px-2')}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full transition duration-200 ease-out',
                  PHOTO_GLASS,
                  ctrlSize,
                )}
              >
                <SpriteIcon icon="solar:alt-arrow-right-linear" width={ctrlIcon} height={ctrlIcon} />
              </span>
            </button>
          </>
        )}
        {/* Open the photo full screen. Sits above the arrows' tappable third
            (they span the full height of the right edge) and takes the same
            glass-pill treatment, so the two read as one control set. */}
        {displayImages.length > 0 && (
          <button
            type="button"
            onClick={openLightbox}
            onPointerEnter={preloadLightbox}
            onTouchStart={preloadLightbox}
            onFocus={preloadLightbox}
            aria-label={tLightbox('viewImageFullscreen')}
            className={cn(
              // tap-zone: the visible circle is 32-40px; the hit area is 44px.
              'tap-zone absolute z-30 inline-flex items-center justify-center rounded-full',
              PHOTO_SOLID,
              'transition-colors duration-200 ease-out cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              ctrlSize,
              isLarge ? 'bottom-4 right-4' : 'bottom-2 right-2',
            )}
          >
            <SpriteIcon
              icon="solar:maximize-square-minimalistic-linear"
              width={ctrlIcon}
              height={ctrlIcon}
            />
          </button>
        )}
        {hasMultipleImages && view === 'large' && (
          // A full-width strip at the foot of the photo: without `!` it caught
          // the taps meant for the card's link and did nothing (dead clicks).
          <div className="absolute bottom-[34px] left-0 right-0 z-20 flex justify-center gap-1 pointer-events-none!">
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
        <div className={cn('block group/image h-full w-full')}>{slideTrack}</div>
      ) : (
        <Link href={href} className={cn('block group/image h-full w-full')}>
          {slideTrack}
        </Link>
      )}
      {/* Portalled to the body: the card wrapper clips its overflow, and a card
          can sit inside a scroller or a future transformed carousel, either of
          which would trap a fixed-position overlay rendered in place. Only a
          click opens it, so `document` is always there by then. */}
      {lightboxOpen
        ? createPortal(
            <ImageLightbox
              images={imageList.map((img) => ({ url: img.src, alt: imageAlt }))}
              initialIndex={imageIndex}
              alt={imageAlt}
              isOpen={lightboxOpen}
              onClose={closeLightbox}
              action={
                locale && contactLabel ? (
                  <PropertyContactButton
                    locale={locale}
                    propertySlug={slug}
                    propertyTitle={name}
                    agentSlug={null}
                    agentName={null}
                    placement="property-card"
                    label={contactLabel}
                    className={brandButtonClass('primary', undefined, 'sm')}
                  />
                ) : undefined
              }
            />,
            document.body,
          )
        : null}
    </div>
  )
}
