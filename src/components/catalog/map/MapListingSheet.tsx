'use client'

import * as React from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Link from '@/components/shared/Link'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { PropertyContactButton } from '@/components/property/PropertyContactModal'
import { PropertyCardMeta } from '@/components/shared/property/PropertyCardMeta'
import { brandButtonClass } from '@/components/shared/BrandButton'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatMoney } from '@/lib/currency/format'
import { convertFromBaseEur } from '@/lib/currency/convert'
import { displayDealLabel } from '@/lib/property/cardFormatters'
import { showsPlotArea, showsRooms } from '@/lib/property/plotArea'
import { cn } from '@/lib/utils'
import type { PropertyHomes } from '@/types/propertyHomes'

/** Photos in the window; the listing page has the rest. */
const MAX_PHOTOS = 12
/** A downward drag past this closes the sheet. */
const CLOSE_DRAG_PX = 90

/**
 * The listing a map pin stands for, without leaving the map (the pattern of
 * Bird/LUN and Airbnb): swipeable photos, price, rooms, favourite, enquiry and
 * a link to the full page.
 *
 * `sheet`: a bottom sheet over the full-screen map; drag the handle down or
 * tap × to close. `panel`: the same card inside the desktop map panel.
 */
type SheetProps = {
  href: string
  locale: string
  variant: 'sheet' | 'panel'
  /** The listing is one of several on its point (flats of one building): a pager. */
  stack?: SheetStack | null
  onClose: () => void
}

/** Where the picked listing sits among those sharing its point. */
export type SheetStack = {
  /** 0-based. */
  index: number
  count: number
  /** A shared approximate point is a place, not a building. */
  approximate: boolean
  onStep: (dir: 1 | -1) => void
}

/** `item: null` while the listing is still loading: the same window, as a placeholder. */
export function MapListingSheet({ item, busy, ...props }: SheetProps & { item: PropertyHomes | null; busy?: boolean }) {
  if (!item) return <SheetPlaceholder variant={props.variant} stack={props.stack} onClose={props.onClose} />
  return <ListingSheet item={item} busy={busy} {...props} />
}

/**
 * "‹ 2 / 11 in this building ›". At the bottom edge of the window, which is
 * the edge pinned to the map: the window's height follows each listing, and a
 * pager on top moved under the finger from one step to the next.
 */
function StackPager({ stack, className }: { stack: SheetStack; className?: string }) {
  const tMap = useTranslations('Shared.map')
  const text = tMap(stack.approximate ? 'stackPagerPlace' : 'stackPager', {
    index: stack.index + 1,
    count: stack.count,
  })
  const button =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dark/15 text-lg leading-none text-dark transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white'
  return (
    <div className={cn('flex items-center gap-2 border-t border-dark/10 bg-white px-3 py-2 dark:border-white/15 dark:bg-dark', className)}>
      <button type="button" onClick={() => stack.onStep(-1)} aria-label={tMap('stackPrevious')} className={button}>
        ‹
      </button>
      <span aria-live="polite" className="min-w-0 flex-1 truncate text-center text-xs font-medium tabular-nums text-dark/70 dark:text-white/70">
        {text}
      </span>
      <button type="button" onClick={() => stack.onStep(1)} aria-label={tMap('stackNext')} className={button}>
        ›
      </button>
    </div>
  )
}

function SheetPlaceholder({ variant, stack, onClose }: Pick<SheetProps, 'variant' | 'stack' | 'onClose'>) {
  const tCard = useTranslations('Shared.propertyCard')
  const isSheet = variant === 'sheet'
  return (
    <div
      aria-busy="true"
      className={cn(
        'absolute z-20 overflow-hidden bg-white shadow-2xl dark:bg-dark',
        isSheet
          ? cn(
              'inset-x-0 bottom-0 rounded-t-3xl px-3 pt-6 sm:inset-x-auto sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2',
              // With a pager the bottom edge is the pager's, as in the window.
              stack ? 'pb-[var(--app-bottom-inset,0px)]' : 'pb-4'
            )
          : 'inset-x-3 bottom-3 flex h-[200px] rounded-2xl border border-dark/10 dark:border-white/15'
      )}
    >
      <div className={cn('animate-pulse bg-dark/10 dark:bg-white/10', isSheet ? 'aspect-[16/10] rounded-2xl' : 'w-[44%]')} />
      <div className={cn('min-w-0 flex-1', !isSheet && 'flex flex-col')}>
        <div className={cn('space-y-2', isSheet ? cn('px-1 pt-3', stack && 'pb-4') : 'flex-1 p-3')}>
          <div className="h-5 w-1/3 animate-pulse rounded bg-dark/10 dark:bg-white/10" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-dark/10 dark:bg-white/10" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-dark/10 dark:bg-white/10" />
        </div>
        {stack ? <StackPager stack={stack} className={isSheet ? '-mx-3' : undefined} /> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={tCard('closePreview')}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-dark shadow-sm dark:bg-dark/90 dark:text-white"
      >
        ×
      </button>
    </div>
  )
}

function ListingSheet({
  item,
  href,
  locale,
  variant,
  stack,
  busy = false,
  onClose,
}: SheetProps & { item: PropertyHomes; busy?: boolean }) {
  const tCard = useTranslations('Shared.propertyCard')
  const tDeal = useTranslations('Shared.propertyDetail')
  const tMap = useTranslations('Shared.map')
  const { currency, rates } = useCurrency()

  const photos = (item.images ?? []).filter((img) => img?.src).slice(0, MAX_PHOTOS)
  const [photoIndex, setPhotoIndex] = React.useState(0)
  const stripRef = React.useRef<HTMLDivElement | null>(null)

  // A new listing starts at its first photo.
  React.useEffect(() => {
    setPhotoIndex(0)
    stripRef.current?.scrollTo({ left: 0 })
  }, [item.slug])

  const onStripScroll = React.useCallback(() => {
    const el = stripRef.current
    if (!el || el.clientWidth === 0) return
    setPhotoIndex(Math.round(el.scrollLeft / el.clientWidth))
  }, [])
  const step = (dir: 1 | -1) => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  // Slide in on mount.
  const [shown, setShown] = React.useState(false)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Drag the sheet down by its handle/header to close it.
  const [dragY, setDragY] = React.useState(0)
  const dragStart = React.useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0]?.clientY ?? null
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (dragStart.current == null) return
    setDragY(Math.max(0, (e.touches[0]?.clientY ?? 0) - dragStart.current))
  }
  const onTouchEnd = () => {
    if (dragY > CLOSE_DRAG_PX) onClose()
    dragStart.current = null
    setDragY(0)
  }

  // Price, as the card shows it: a rate stays a rate, zero is "on request".
  const basePrice =
    typeof item.price === 'number'
      ? item.price
      : typeof item.rate === 'string' && item.rate.trim()
        ? Number(item.rate.replace(/[^\d.-]/g, ''))
        : NaN
  const isRate = item.priceUnit === 'per-sqm'
  const amount = Number.isFinite(basePrice) ? formatMoney(convertFromBaseEur(basePrice, currency, rates), currency, locale) : ''
  const priceText =
    Number.isFinite(basePrice) && basePrice <= 0
      ? tCard('priceOnRequest')
      : amount
        ? isRate
          ? tCard('pricePerSqmFrom', { amount })
          : amount
        : tCard('priceOnRequest')
  const area = typeof item.area === 'number' ? item.area : NaN
  const perSqm =
    !isRate && Number.isFinite(basePrice) && basePrice > 0 && Number.isFinite(area) && area > 0
      ? `${formatMoney(convertFromBaseEur(Math.round(basePrice / area), currency, rates), currency, locale)} / m²`
      : ''
  const approximate = item.locationPrecision === 'approximate'
  const isSheet = variant === 'sheet'

  return (
    <div
      role="dialog"
      aria-label={item.name || tCard('propertyFallback')}
      aria-busy={busy || undefined}
      className={cn(
        'absolute z-20 overflow-hidden bg-white text-dark shadow-2xl dark:bg-dark dark:text-white',
        'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isSheet
          ? 'inset-x-0 bottom-0 max-h-[78%] overflow-y-auto rounded-t-3xl pb-[var(--app-bottom-inset,0px)] sm:inset-x-auto sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2'
          : // Desktop panel: photo beside the details, so the map stays in view.
            'inset-x-3 bottom-3 flex max-h-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border border-dark/10 dark:border-white/15',
        !shown && (isSheet ? 'translate-y-full' : 'translate-y-4 opacity-0')
      )}
      style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
    >
      {isSheet ? (
        <div
          className="flex cursor-grab touch-none justify-center pb-1 pt-2"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          aria-hidden
        >
          <span className="h-1.5 w-10 rounded-full bg-dark/20 dark:bg-white/25" />
        </div>
      ) : null}

      <div className={cn('relative', isSheet ? 'px-3' : 'w-[44%] shrink-0')}>
        <div className={cn('relative overflow-hidden bg-dark/5 dark:bg-white/10', isSheet ? 'rounded-2xl' : 'h-full min-h-[200px]')}>
          {photos.length > 0 ? (
            <div
              ref={stripRef}
              onScroll={onStripScroll}
              className={cn(
                'flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                isSheet ? 'aspect-[16/10]' : 'absolute inset-0',
                // The next listing of a building still loading: this one stays, dimmed.
                'transition-opacity',
                busy && 'opacity-50'
              )}
            >
              {photos.map((img, i) => (
                <div key={`${img.src}-${i}`} className="relative h-full w-full shrink-0 snap-center">
                  <Image
                    src={img.src}
                    alt={`${item.name || tCard('propertyFallback')} — ${i + 1}`}
                    fill
                    sizes={isSheet ? '(min-width: 640px) 440px, 100vw' : '280px'}
                    className="object-cover"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={isSheet ? 'aspect-[16/10]' : 'absolute inset-0'} />
          )}

          {photos.length > 1 ? (
            <>
              <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white">
                {photoIndex + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={photoIndex === 0}
                aria-label={tCard('previousImage')}
                className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-dark shadow disabled:opacity-0 sm:flex"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={photoIndex >= photos.length - 1}
                aria-label={tCard('nextImage')}
                className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-dark shadow disabled:opacity-0 sm:flex"
              >
                ›
              </button>
            </>
          ) : null}

          <div className="absolute left-2 top-2">
            <FavoriteButton slug={item.slug} name={item.name} size="compact" imageUrl={photos[0]?.src ?? null} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tCard('closePreview')}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-dark shadow-sm dark:bg-dark/90 dark:text-white"
          >
            ×
          </button>
        </div>
      </div>

      {/* Details, then the building's pager as a footer: in the panel below
          the scrolling details, in the sheet held to the bottom while it scrolls. */}
      <div className={cn('min-w-0', !isSheet && 'flex flex-1 flex-col')}>
        <div
          className={cn(
            'min-w-0 space-y-2 transition-opacity',
            isSheet ? 'px-4 pb-4 pt-3' : 'min-h-0 flex-1 overflow-y-auto p-3',
            busy && 'opacity-50'
          )}
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-lg font-semibold leading-tight">{priceText}</span>
            {perSqm ? <span className="text-xs text-dark/55 dark:text-white/55">{perSqm}</span> : null}
            {item.status ? (
              <span className="ml-auto rounded-full border border-primary/70 px-2.5 py-0.5 text-xs text-primary">
                {displayDealLabel(item.status, tDeal, { compact: true })}
              </span>
            ) : null}
          </div>
          <Link
            href={href}
            className={cn('block font-medium leading-snug hover:text-primary line-clamp-2', isSheet ? 'text-[15px]' : 'text-sm')}
          >
            {item.name}
          </Link>
          <p className="truncate text-xs text-dark/60 dark:text-white/60">
            {[item.propertyType, item.location].filter(Boolean).join(' · ')}
          </p>
          {approximate ? (
            <p className="text-[11px] leading-snug text-dark/55 dark:text-white/55">≈ {tMap('approximateShort')}</p>
          ) : null}
          <PropertyCardMeta
            view="small"
            beds={item.beds}
            baths={item.baths}
            area={item.area}
            plotArea={item.plotArea}
            showPlot={showsPlotArea(item.propertyTypeSlug)}
            showRooms={showsRooms(item.propertyTypeSlug)}
          />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <PropertyContactButton
              locale={locale}
              propertySlug={item.slug}
              propertyTitle={item.name}
              agentSlug={null}
              agentName={null}
              placement="map"
              label={tCard('requestInfo')}
              className={brandButtonClass('primaryOutline', 'w-full', 'sm')}
            />
            <Link href={href} className={brandButtonClass('primary', 'w-full', 'sm')}>
              {tMap('openListing')}
            </Link>
          </div>
        </div>
        {stack ? <StackPager stack={stack} className={isSheet ? 'sticky bottom-0' : 'shrink-0'} /> : null}
      </div>
    </div>
  )
}
