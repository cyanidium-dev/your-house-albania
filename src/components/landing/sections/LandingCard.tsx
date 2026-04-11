import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
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
}: {
  locale: string
  card: LandingCardModel
  /** e.g. `h-full` for carousel slides */
  className?: string
}) {
  const cardTitle = resolveLandingCardTitle(card, locale)
  const cardDescription = resolveLandingCardDescription(card, locale)
  const imgUrl = resolveLandingCardImageUrl(card)
  const linkedCitySlug = card.linkedCity?.slug ?? null
  const href = landingHref({
    locale,
    pageType: card.pageType ?? null,
    slug: card.slug ?? null,
    linkedCitySlug,
    linkedCityCountrySlug: card.linkedCity?.countrySlug ?? null,
  })
  const unoptimized = imgUrl?.startsWith('http') ?? false

  return (
    <Link href={href} className={cn(cardLinkClass, className)}>
      <div className="relative aspect-[16/10] bg-dark/5 dark:bg-white/5">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={card.cardImage?.alt ?? cardTitle}
            fill
            className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 1023px) 100vw, 33vw"
            unoptimized={unoptimized}
          />
        ) : null}
      </div>
      <div className="p-5">
        <div className="font-semibold text-dark dark:text-white line-clamp-1">{cardTitle}</div>
        {cardDescription ? (
          <div className="mt-2 text-sm text-dark/60 dark:text-white/60 line-clamp-2">{cardDescription}</div>
        ) : null}
      </div>
    </Link>
  )
}
