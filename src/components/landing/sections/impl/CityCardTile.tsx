import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import type { LocationCarouselCard } from "@/lib/sanity/cityAdapter";

type Size = "compact" | "default";

export function CityCardTile({
  card,
  size = "default",
  sizes,
}: {
  card: LocationCarouselCard;
  size?: Size;
  sizes?: string;
}) {
  const isCompact = size === "compact";
  return (
    <Link
      href={card.href}
      className="group relative block rounded-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="relative w-full aspect-[320/386]">
        {card.heroImageUrl ? (
          <Image
            src={card.heroImageUrl}
            alt={card.title}
            fill
            sizes={
              sizes ?? "(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            }
            className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
            unoptimized={!!card.heroImageUrl?.startsWith("http")}
          />
        ) : (
          <div className="absolute inset-0 bg-dark/10 dark:bg-white/10" />
        )}
      </div>

      {/* Persistent base gradient — always visible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
      />

      {/* Always-visible title row */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 z-10 ${
          isCompact ? "p-3.5" : "p-5 md:p-6"
        }`}
      >
        <h3
          className={`text-white font-medium leading-tight line-clamp-2 ${
            isCompact ? "text-base" : "text-lg md:text-xl"
          }`}
        >
          {card.title}
        </h3>
        <span
          aria-hidden
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white text-dark transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:-translate-y-0.5 ${
            isCompact ? "h-8 w-8" : "h-9 w-9 md:h-10 md:w-10"
          }`}
        >
          <Icon icon="ph:arrow-right" width={isCompact ? 14 : 16} height={isCompact ? 14 : 16} />
        </span>
      </div>

      {/* Hover-only description reveal — desktop only */}
      {card.shortDescription ? (
        <div
          aria-hidden
          className="hidden md:flex absolute inset-0 z-20 flex-col justify-end p-6 bg-gradient-to-t from-black/85 via-black/55 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        >
          <h3 className="text-white text-xl font-medium leading-tight mb-2 line-clamp-2">
            {card.title}
          </h3>
          <p className="text-white/85 text-sm md:text-base leading-6 line-clamp-3">
            {card.shortDescription}
          </p>
        </div>
      ) : null}
    </Link>
  );
}
