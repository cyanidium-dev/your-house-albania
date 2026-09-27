"use client";

import * as React from "react";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { cn } from "@/lib/utils";
import type { PropertyHomes } from "@/types/propertyHomes";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { catalogPath } from "@/lib/routes/catalog";
import { currentCityListingHref } from "@/lib/routes/currentCityListing";
import { routing } from "@/i18n/routing";
import { brandButtonClass } from "@/components/shared/BrandButton";
import { segmentedItemClass, segmentedTrackClass } from "@/components/shared/Segmented";
import { CarouselArrowButton } from "@/components/shared/CarouselArrow";

export type TopOffersGroup = "popular" | "new" | "highDemand";

const GROUPS: TopOffersGroup[] = ["popular", "new", "highDemand"];

export function TopOffersCarouselClient({
  locale,
  groups,
  initialGroup = "popular",
  showTabs = true,
}: {
  locale: string;
  groups: Record<TopOffersGroup, PropertyHomes[]>;
  initialGroup?: TopOffersGroup;
  /**
   * Off for a carousel that was fetched with one filtered query: its three
   * groups are the same list, so tabs would promise a different set of
   * properties and then show the same eight cards.
   */
  showTabs?: boolean;
}) {
  const debug = process.env.NODE_ENV === "development";
  const t = useTranslations("Home.topOffers");
  // On a city or district page "all properties" are that city's.
  const allHref = currentCityListingHref(usePathname(), routing.locales) ?? catalogPath(locale);
  const [active, setActive] = React.useState<TopOffersGroup>(initialGroup);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const items = groups[active] ?? [];
  if (debug) {
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
    scrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [active]);

  const scrollByCards = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = 360;
    el.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
  };

  return (
    <div className="min-w-0">
      <div
        className={cn(
          'flex items-center gap-3 min-w-0',
          showTabs ? 'justify-between' : 'justify-end'
        )}
      >
        <div
          className={segmentedTrackClass(!showTabs ? 'hidden' : undefined)}
        >
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
                className={segmentedItemClass(activeTab)}
              >
                <span className="block max-w-full truncate">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <CarouselArrowButton direction="prev" onClick={() => scrollByCards(-1)} label={t("prev")} />
          <CarouselArrowButton direction="next" onClick={() => scrollByCards(1)} label={t("next")} />
        </div>
      </div>

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

      <div className="mt-8 flex justify-center">
        <Link href={allHref} className={brandButtonClass("primary")}>
          {t("ctaAll")}
        </Link>
      </div>
    </div>
  );
}
