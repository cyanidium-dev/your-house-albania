"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { cn } from "@/lib/utils";
import type { PropertyHomes } from "@/types/propertyHomes";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { catalogPath } from "@/lib/routes/catalog";

export type TopOffersGroup = "popular" | "new" | "highDemand";

const GROUPS: TopOffersGroup[] = ["popular", "new", "highDemand"];

export function TopOffersCarouselClient({
  locale,
  groups,
  initialGroup = "popular",
}: {
  locale: string;
  groups: Record<TopOffersGroup, PropertyHomes[]>;
  initialGroup?: TopOffersGroup;
}) {
  const debug = process.env.NODE_ENV === "development";
  const t = useTranslations("Home.topOffers");
  const [active, setActive] = React.useState<TopOffersGroup>(initialGroup);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const items = groups[active] ?? [];
  if (debug) {
    // Client-side log (browser console) to verify final rendered counts.
    console.log("[Landing][TopOffersCarouselClient] render", {
      locale,
      active,
      counts: {
        popular: groups.popular?.length ?? null,
        new: groups.new?.length ?? null,
        highDemand: groups.highDemand?.length ?? null,
      },
      itemsCount: items.length,
      sampleSlug: items[0]?.slug ?? null,
    });
  }

  React.useEffect(() => {
    // reset scroll when switching groups
    scrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [active]);

  const scrollByCards = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = 360; // approximate; snap will settle
    el.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
  };

  return (
    <div className="min-w-0">
      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-dark/5 dark:bg-white/10 p-1.5 ring-1 ring-dark/5 dark:ring-white/10">
          {GROUPS.map((g) => {
            const activeTab = g === active;
            const label =
              g === "popular"
                ? t("tabs.popular")
                : g === "new"
                  ? t("tabs.new")
                  : t("tabs.highDemand");
            return (
              <button
                key={g}
                type="button"
                onClick={() => setActive(g)}
                className={cn(
                  "h-9 px-4 rounded-full font-semibold text-sm",
                  "transition-[background-color,color,box-shadow] duration-200 ease-out cursor-pointer",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
                  activeTab
                    ? "bg-white dark:bg-dark text-dark dark:text-white shadow-sm ring-1 ring-dark/5 dark:ring-white/10"
                    : "text-dark/70 dark:text-white/70 hover:bg-dark/10 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white"
                )}
              >
                <span className="block max-w-full truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Arrows (desktop) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            className="h-10 w-10 rounded-full border border-dark/10 dark:border-white/10 bg-white/70 dark:bg-dark/60 backdrop-blur-md shadow-sm hover:bg-white dark:hover:bg-dark transition-colors cursor-pointer flex items-center justify-center"
            aria-label={t("prev")}
          >
            <Icon icon="solar:alt-arrow-left-linear" width={18} height={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            className="h-10 w-10 rounded-full border border-dark/10 dark:border-white/10 bg-white/70 dark:bg-dark/60 backdrop-blur-md shadow-sm hover:bg-white dark:hover:bg-dark transition-colors cursor-pointer flex items-center justify-center"
            aria-label={t("next")}
          >
            <Icon icon="solar:alt-arrow-right-linear" width={18} height={18} />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="mt-6 min-w-0">
        <div
          ref={scrollerRef}
          className={cn(
            "flex gap-4 overflow-x-auto min-w-0 pb-3 pt-1",
            "-mx-2 sm:-mx-4 px-2 sm:px-4",
            "snap-x snap-mandatory scroll-px-2 sm:scroll-px-4",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {items.map((item, idx) => (
            <div
              key={item.slug ?? idx}
              className="snap-start shrink-0 w-[280px] sm:w-[320px] md:w-[360px] min-w-0"
            >
              <PropertyCard item={item} locale={locale} view="large" fullClickable />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex justify-center">
        <Link
          href={catalogPath(locale)}
          className="inline-flex items-center justify-center h-11 px-8 rounded-full font-semibold bg-dark text-white hover:bg-primary transition-colors duration-200 ease-out cursor-pointer"
        >
          {t("ctaAll")}
        </Link>
      </div>
    </div>
  );
}

