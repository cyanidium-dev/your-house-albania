"use client";

import * as React from "react";
import { PropertySearchBar } from "@/components/catalog/PropertySearchBar";
import { PropertyPagination } from "@/components/catalog/PropertyPagination";
import { CatalogEmptyState } from "@/components/catalog/CatalogEmptyState";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { useCatalogView } from "@/contexts/CatalogViewContext";
import { cn } from "@/lib/utils";
import type { PropertyHomes } from "@/types/properyHomes";
import type { ViewMode } from "@/lib/catalog/viewMode";
import { PropertiesMap } from "@/components/catalog/map/PropertiesMap";

export type CatalogFilterProps = {
  locations: Array<{ value: string; label: string }>;
  propertyTypes: Array<{ value: string; label: string }>;
  dealTypeValues: readonly string[];
  districtOptions: Array<{ value: string; label: string; citySlug?: string }>;
  priceRangesByDeal: Record<string, { min: number; max: number }>;
  amenityOptions: Array<{ value: string; label: string }>;
  initialCity: string;
  initialType: string;
  initialDealType: string;
  initialMinPrice: string;
  initialMaxPrice: string;
  initialBeds: string;
  initialDistrict: string;
  initialSort: string;
  initialAmenities: string[];
  initialPageSize: string;
  initialView?: ViewMode;
};

export type CatalogBodyClientProps = {
  filterProps: CatalogFilterProps;
  pageItems: PropertyHomes[];
  locale: string;
  totalPages: number;
  currentPage: number;
};

/**
 * Client boundary: reads viewMode from context, renders filters (with getCurrentView)
 * and results. Only results re-render when viewMode changes; filters get stable
 * getCurrentView ref so they don't re-render.
 */
export function CatalogBodyClient({
  filterProps,
  pageItems,
  locale,
  totalPages,
  currentPage,
}: CatalogBodyClientProps) {
  const { viewMode, getCurrentView } = useCatalogView();
  const [activeSlug, setActiveSlug] = React.useState<string | null>(null);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const shouldScrollToActiveRef = React.useRef(false);
  const prevActiveSlugRef = React.useRef<string | null>(null);

  const handleActiveSlugFromMap = React.useCallback(
    (slug: string) => {
      // Marker click is the "explicit selection" that should bring the card into view.
      shouldScrollToActiveRef.current = true;
      setActiveSlug(slug);
    },
    [setActiveSlug]
  );

  const gridClass = cn(
    viewMode === "list" && "flex flex-col gap-3 min-w-0",
    viewMode === "small" &&
      "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 min-w-0",
    viewMode === "large" &&
      "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 md:gap-10 min-w-0"
  );

  React.useEffect(() => {
    if (!activeSlug) return
    const activeItem = pageItems.find((p) => p.slug === activeSlug)
    if (!activeItem) {
      setActiveSlug(null)
      return
    }

    const lat = activeItem.coordinates?.lat
    const lng = activeItem.coordinates?.lng
    const hasValidCoords =
      typeof lat === 'number' &&
      Number.isFinite(lat) &&
      typeof lng === 'number' &&
      Number.isFinite(lng)

    if (!hasValidCoords) setActiveSlug(null)
  }, [activeSlug, pageItems])

  React.useEffect(() => {
    if (activeSlug == null) {
      // If selection was cleared (filter/pagination/invalid coords), don't scroll later.
      shouldScrollToActiveRef.current = false
    }
  }, [activeSlug])

  React.useEffect(() => {
    if (!shouldScrollToActiveRef.current) return
    if (!activeSlug) return
    // Avoid scrolling on pagination/filter re-renders when activeSlug didn't change.
    if (prevActiveSlugRef.current === activeSlug) return
    // Only scroll if the active card exists in current results.
    const activeExists = pageItems.some((p) => p.slug === activeSlug)
    if (!activeExists) {
      shouldScrollToActiveRef.current = false
      return
    }

    const el = cardRefs.current[activeSlug]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    shouldScrollToActiveRef.current = false
    prevActiveSlugRef.current = activeSlug
  }, [activeSlug, pageItems])

  React.useEffect(() => {
    prevActiveSlugRef.current = activeSlug
  }, [activeSlug])

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const activeItem = activeSlug ? pageItems.find((p) => p.slug === activeSlug) : null
    const lat = activeItem?.coordinates?.lat
    const lng = activeItem?.coordinates?.lng
    const activeHasCoords =
      typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng)

    console.log('[CatalogMap][debug]', {
      pageItemsCount: pageItems.length,
      activeSlug,
      activeHasCoords,
    })
  }, [pageItems, activeSlug])

  const mapItems = React.useMemo(
    () =>
      pageItems.map((p) => ({
        slug: p.slug,
        price: p.price,
        currency: p.currency,
        rate: p.rate,
        status: p.status,
        coordinates: p.coordinates,
      })),
    [pageItems]
  )

  const mapHeightClassName =
    viewMode === 'list'
      ? 'h-[250px] md:h-[270px]'
      : viewMode === 'small'
        ? 'h-[220px] sm:h-[235px] md:h-[255px] lg:h-[255px] xl:h-[255px]'
        : 'h-[330px] md:h-[360px] xl:h-[390px]'

  const mapListItemClassName = cn(
    'min-w-0 self-start',
    viewMode === 'small' && 'col-span-2'
  )

  return (
    <>
      {/* Filters: layout containment so results grid (viewMode) never affects this block */}
      <div className="min-w-0 [contain:layout]">
        <PropertySearchBar
          {...filterProps}
          getCurrentView={getCurrentView}
        />
      </div>
      <div className="min-w-0 min-h-0 pb-12 sm:pb-16 md:pb-20">
        <div className={gridClass}>
          <div className={mapListItemClassName}>
            <PropertiesMap
              items={mapItems}
              activeSlug={activeSlug}
              onActiveSlugChange={handleActiveSlugFromMap}
              mapHeightClassName={mapHeightClassName}
              selectedCitySlug={filterProps.initialCity || undefined}
              selectedDistrictSlug={filterProps.initialDistrict || undefined}
              selectedDealType={filterProps.initialDealType || undefined}
            />
          </div>
          {pageItems.map((item, index) => {
            const isActive = activeSlug === item.slug
            return (
              <div
                key={item.slug ?? index}
                className={cn("min-w-0", isActive && "rounded-2xl ring-2 ring-primary/40")}
                ref={(el) => {
                  if (!item.slug) return
                  cardRefs.current[item.slug] = el
                }}
                onPointerDownCapture={() => {
                  // List click selection should not auto-scroll; keep normal scrolling behavior.
                  shouldScrollToActiveRef.current = false
                  setActiveSlug(item.slug)
                }}
              >
                <PropertyCard item={item} locale={locale} view={viewMode} />
              </div>
            )
          })}
        </div>
        {pageItems.length === 0 ? (
          <CatalogEmptyState locale={locale} />
        ) : (
          totalPages > 1 && (
            <PropertyPagination currentPage={currentPage} totalPages={totalPages} />
          )
        )}
      </div>
    </>
  );
}
