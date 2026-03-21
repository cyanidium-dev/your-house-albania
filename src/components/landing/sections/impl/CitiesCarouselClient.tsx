"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import type { LocationCarouselCard } from "@/lib/sanity/cityAdapter";

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
            <div className="relative rounded-2xl overflow-hidden group">
              <Link
                href={card.href}
                className="block relative w-full aspect-[320/386]"
              >
                {card.heroImageUrl ? (
                  <Image
                    src={card.heroImageUrl}
                    alt={card.title}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={!!card.heroImageUrl?.startsWith("http")}
                  />
                ) : (
                  <div className="absolute inset-0 bg-dark/10 dark:bg-white/10" />
                )}
              </Link>
              <Link
                href={card.href}
                className="absolute w-full h-full bg-gradient-to-b from-black/0 to-black/80 top-full flex flex-col justify-between pl-6 pb-6 group-hover:top-0 duration-500"
              >
                <div className="flex justify-end mt-4 mr-4">
                  <div className="bg-white text-dark rounded-full w-fit p-3">
                    <Icon icon="ph:arrow-right" width={20} height={20} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-white text-xl">{card.title}</h3>
                  <p className="text-white/80 text-sm leading-6 line-clamp-2">
                    {card.shortDescription || ""}
                  </p>
                </div>
              </Link>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-4 lg:-left-12" />
      <CarouselNext className="-right-4 lg:-right-12" />
    </Carousel>
  );
}
