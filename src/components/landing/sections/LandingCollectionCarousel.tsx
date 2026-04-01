'use client'

import * as React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { LandingCard } from '@/components/landing/sections/LandingCard'
import type { LandingCardModel } from '@/components/landing/sections/landingFamilySectionHelpers'

export function LandingCollectionCarousel({
  locale,
  cards,
}: {
  locale: string
  cards: LandingCardModel[]
}) {
  if (cards.length === 0) return null

  return (
    <div className="relative -mx-4 px-4 lg:-mx-12 lg:px-12">
      <Carousel
        opts={{
          align: 'start',
          loop: cards.length > 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {cards.map((c, idx) => (
            <CarouselItem
              key={c._id ?? idx}
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
            >
              <LandingCard locale={locale} card={c} className="h-full" />
            </CarouselItem>
          ))}
        </CarouselContent>
        {cards.length > 1 ? (
          <>
            <CarouselPrevious className="-left-4 lg:-left-12" />
            <CarouselNext className="-right-4 lg:-right-12" />
          </>
        ) : null}
      </Carousel>
    </div>
  )
}
