"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import type { LocationCarouselCard } from "@/lib/sanity/cityAdapter";
import { CityCardTile } from "./CityCardTile";

type CitiesCarouselClientProps = {
  cards: LocationCarouselCard[];
  locale?: string;
};

export function CitiesCarouselClient({ cards }: CitiesCarouselClientProps) {
  if (cards.length === 0) return null;

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-4">
        {cards.map((card) => (
          <CarouselItem
            key={card._id ?? card.slug}
            className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
          >
            <CityCardTile card={card} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-4 lg:-left-12" />
      <CarouselNext className="-right-4 lg:-right-12" />
    </Carousel>
  );
}
