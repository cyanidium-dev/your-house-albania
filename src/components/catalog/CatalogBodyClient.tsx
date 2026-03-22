"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PropertySearchBar } from "@/components/catalog/PropertySearchBar";
import { PropertyPagination } from "@/components/catalog/PropertyPagination";
import { CatalogEmptyState } from "@/components/catalog/CatalogEmptyState";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { useCatalogView } from "@/contexts/CatalogViewContext";
import { cn } from "@/lib/utils";
import type { PropertyHomes } from "@/types/propertyHomes";
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
  const tCard = useTranslations("Shared.propertyCard");
  const [activeSlug, setActiveSlug] = React.useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = React.useState<string | null>(null);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const shouldScrollToActiveRef = React.useRef(false);
  const prevActiveSlugRef = React.useRef<string | null>(null);
  const mapCardRef = React.useRef<HTMLDivElement | null>(null);
  const previewRef = React.useRef<HTMLDivElement | null>(null);

  const handleActiveSlugFromMap = React.useCallback(
    (slug: string) => {
      // Marker click: select marker and show preview, but do NOT scroll list.
      shouldScrollToActiveRef.current = false;
      setActiveSlug(slug);
      setPreviewSlug(slug);
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

  // Map item: in-flow with cards. Grid modes use stretch + h-full so map matches row height.
  const mapListItemClassName = cn(
    "min-w-0",
    viewMode === "list" && "self-start w-full",
    viewMode === "small" && "col-span-2",
    (viewMode === "small" || viewMode === "large") && "min-h-0"
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
    if (!previewSlug) return
    const exists = pageItems.some((p) => p.slug === previewSlug)
    if (!exists) setPreviewSlug(null)
  }, [previewSlug, pageItems])

  React.useEffect(() => {
    const onPointerDown = (ev: PointerEvent) => {
      if (!previewSlug) return
      const target = ev.target as Node | null
      if (!target) return
      if (previewRef.current?.contains(target)) return
      if (!mapCardRef.current?.contains(target)) return
      setPreviewSlug(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [previewSlug])

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

  // List: fixed height. Grid modes: fixed on mobile; md+ use h-full so map matches row height.
  const mapHeightClassName =
    viewMode === "list"
      ? "h-[250px] md:h-[270px]"
      : viewMode === "small"
        ? "h-[220px] sm:h-[235px] md:h-full md:min-h-[200px]"
        : "h-[330px] md:h-full md:min-h-[200px]";

  const isSmallMode = viewMode === 'small'

  const previewItem = React.useMemo(
    () => (previewSlug ? pageItems.find((p) => p.slug === previewSlug) ?? null : null),
    [previewSlug, pageItems]
  )

  const previewHref = React.useMemo(() => {
    if (!previewItem) return '#'
    return previewItem._href ?? `/${locale}/property/${previewItem.slug}`
  }, [previewItem, locale])

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
          <div className={cn(mapListItemClassName, "relative")} ref={mapCardRef}>
            <PropertiesMap
              items={mapItems}
              activeSlug={activeSlug}
              onActiveSlugChange={handleActiveSlugFromMap}
              mapHeightClassName={mapHeightClassName}
              className={(viewMode === "small" || viewMode === "large") ? "h-full" : undefined}
              selectedCitySlug={filterProps.initialCity || undefined}
              selectedDistrictSlug={filterProps.initialDistrict || undefined}
              selectedDealType={filterProps.initialDealType || undefined}
            />
            {previewItem && (
              <div
                ref={previewRef}
                className={cn(
                  "absolute z-20 rounded-xl border border-dark/10 dark:border-white/20 bg-white/95 dark:bg-black/90 shadow-lg backdrop-blur-sm overflow-visible",
                  // SMALL mode: compact vertical side card to preserve map area
                  isSmallMode
                    ? "right-3 top-3 bottom-3 w-[198px] p-0 flex flex-col"
                    : "left-3 right-3 bottom-3 p-0"
                )}
              >
                <button
                  type="button"
                  onClick={() => setPreviewSlug(null)}
                  className={cn(
                    "absolute z-30 w-7 h-7 rounded-full bg-white/95 dark:bg-black/85 border border-dark/15 dark:border-white/25 text-dark dark:text-white text-sm cursor-pointer shadow-md",
                    isSmallMode ? "-top-2 -right-2" : "top-2 right-2"
                  )}
                  aria-label="Close preview"
                >
                  ×
                </button>
                {isSmallMode ? (
                  <Link href={previewHref} className="block h-full p-2.5 pr-3">
                    <div className="h-full flex flex-col gap-3">
                      <div className="w-full h-[44%] min-h-[92px] rounded-lg overflow-hidden bg-dark/5 dark:bg-white/10">
                        {previewItem.images?.[0]?.src ? (
                          <img
                            src={previewItem.images[0].src}
                            alt={previewItem.name || "Property"}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div className="min-w-0">
                          <p className="text-[11px] text-dark/60 dark:text-white/60 truncate">
                            {previewItem.propertyType || previewItem.status || "Property"}
                          </p>
                          <p className="text-sm font-semibold text-dark dark:text-white truncate">
                            {previewItem.price
                              ? `${Math.round(previewItem.price).toLocaleString()} ${previewItem.currency || "EUR"}`
                              : previewItem.rate}
                          </p>
                          <p className="text-xs text-dark dark:text-white truncate">{previewItem.name}</p>
                          <p className="text-[11px] text-dark/60 dark:text-white/60 truncate mt-0.5">
                            {previewItem.location}
                          </p>
                        </div>
                        <p className="text-[11px] text-dark/70 dark:text-white/70 mt-2 truncate">
                          {tCard('bedroomsCount', { count: previewItem.beds })} • {tCard('bathroomsCount', { count: previewItem.baths })} • {previewItem.area}{tCard('areaUnit')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link href={previewHref} className="block p-3 pr-10">
                    <div className="flex gap-3 items-start">
                      <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-dark/5 dark:bg-white/10">
                        {previewItem.images?.[0]?.src ? (
                          <img
                            src={previewItem.images[0].src}
                            alt={previewItem.name || "Property"}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-dark/60 dark:text-white/60 truncate">
                          {previewItem.propertyType || previewItem.status || "Property"}
                        </p>
                        <p className="text-sm font-semibold text-dark dark:text-white truncate">
                          {previewItem.price
                            ? `${Math.round(previewItem.price).toLocaleString()} ${previewItem.currency || "EUR"}`
                            : previewItem.rate}
                        </p>
                        <p className="text-sm text-dark dark:text-white truncate">{previewItem.name}</p>
                        <p className="text-xs text-dark/60 dark:text-white/60 truncate">{previewItem.location}</p>
                        <p className="text-[11px] text-dark/70 dark:text-white/70 mt-1">
                          {tCard('bedroomsCount', { count: previewItem.beds })} • {tCard('bathroomsCount', { count: previewItem.baths })} • {previewItem.area}{tCard('areaUnit')}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            )}
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
