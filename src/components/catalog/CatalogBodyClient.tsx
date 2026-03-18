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

  const gridClass = cn(
    viewMode === "list" && "flex flex-col gap-3 min-w-0",
    viewMode === "small" &&
      "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 min-w-0",
    viewMode === "large" &&
      "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 md:gap-10 min-w-0"
  );

  return (
    <>
      {/* Filters: layout containment so results grid (viewMode) never affects this block */}
      <div className="min-w-0 [contain:layout]">
        <PropertySearchBar
          {...filterProps}
          getCurrentView={getCurrentView}
        />
      </div>
      {pageItems.length === 0 ? (
        <CatalogEmptyState locale={locale} />
      ) : (
        <div className="min-w-0 min-h-0 pb-12 sm:pb-16 md:pb-20">
          <div className={gridClass}>
            {pageItems.map((item, index) => (
              <div key={item.slug ?? index} className="min-w-0">
                <PropertyCard item={item} locale={locale} view={viewMode} />
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <PropertyPagination currentPage={currentPage} totalPages={totalPages} />
          )}
        </div>
      )}
    </>
  );
}
