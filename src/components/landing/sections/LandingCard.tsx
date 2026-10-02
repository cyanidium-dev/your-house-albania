import * as React from 'react'
import Link from "@/components/shared/Link";
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { NoPhotoPlate } from '@/components/shared/NoPhotoPlate'
import { photoForCity } from '@/lib/media/albaniaPhotos'
import { landingHref } from '@/lib/routes/landings'
import {
  resolveLandingCardDescription,
  resolveLandingCardImageUrl,
  resolveLandingCardTitle,
  type LandingCardModel,
} from '@/components/landing/sections/landingFamilySectionHelpers'

const cardLinkClass =
  'group block rounded-2xl border border-dark/10 dark:border-white/10 overflow-hidden bg-white dark:bg-dark/40 hover:shadow-3xl transition-shadow duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

export function LandingCard({
  locale,
  card,
  className,
  wide = false,
  compact = false,
}: {
  locale: string
  card: LandingCardModel
  /** e.g. `h-full` for carousel slides */
  className?: string
  /** A lone card: photo beside the text from `md`, instead of one narrow card and two empty slots. */
  wide?: boolean
  /**
   * In a grid of several: on a phone the card is a row (thumbnail beside the
   * title), so nine districts are a list to scan, not nine screens of photos.
   */
  compact?: boolean
}) {
  const cardTitle = resolveLandingCardTitle(card, locale)
  const cardDescription = resolveLandingCardDescription(card, locale)
  // A city page without a card image gets the photograph the site ships for
  // that city (the one its hero falls back to). District and guide cards keep
  // the name plate: the city photo on each of them would repeat one beach
  // across a whole row.
  const cityPhoto = card.pageType === 'city' ? photoForCity(card.linkedCity?.slug) : null
  const imgUrl = resolveLandingCardImageUrl(card) ?? cityPhoto?.src ?? null
  const linkedCitySlug = card.linkedCity?.slug ?? null
  const href = landingHref({
    locale,
    pageType: card.pageType ?? null,
    slug: card.slug ?? null,
    linkedCitySlug,
    linkedCityCountrySlug: card.linkedCity?.countrySlug ?? null,
    linkedDistrict: card.linkedDistrict ?? null,
  })
  // No routable URL (e.g. district landing with a broken ref chain) — skip the card.
  if (!href) return null

  // "Qerret or Gjiri i Lalzit: which to choose in 2026" → the place part.
  const plateLabel = cardTitle.split(':')[0]?.trim() || cardTitle

  return (
    <Link
      href={href}
      className={cn(
        cardLinkClass,
        wide && 'md:grid md:grid-cols-12',
        compact && 'max-sm:grid max-sm:grid-cols-[7rem_minmax(0,1fr)]',
        className,
      )}
    >
      <div
        className={cn(
          'relative aspect-[16/10] bg-dark/5 dark:bg-white/5',
          wide && 'md:col-span-5 md:aspect-auto md:min-h-56',
          compact && 'max-sm:aspect-auto max-sm:min-h-[6.5rem]',
        )}
      >
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={card.cardImage?.alt ?? cardTitle}
            fill
            className="object-cover object-center will-change-transform transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            sizes={wide ? '(max-width: 767px) 100vw, 40vw' : '(max-width: 1023px) 100vw, 33vw'}
          />
        ) : (
          <NoPhotoPlate label={plateLabel} className={compact ? 'max-sm:[&>span]:hidden' : undefined} />
        )}
      </div>
      <div
        className={cn(
          'p-5',
          wide && 'md:col-span-7 md:p-8 md:flex md:flex-col md:justify-center',
          compact && 'max-sm:p-4 max-sm:flex max-sm:flex-col max-sm:justify-center',
        )}
      >
        <div className={cn('font-semibold text-dark dark:text-white line-clamp-2', wide && 'md:text-2xl md:tracking-tight')}>
          {cardTitle}
        </div>
        {cardDescription ? (
          <div className={cn('mt-2 text-sm text-dark/60 dark:text-white/60', wide ? 'md:text-base md:line-clamp-3 line-clamp-2' : 'line-clamp-2')}>
            {cardDescription}
          </div>
        ) : null}
      </div>
    </Link>
  )
}
