"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { CatalogFilters } from "@/components/catalog/useCatalogFilters";

/**
 * Collapsed (scrolled) state of the desktop/tablet catalog filters: a single
 * liquid-glass summary pill that mirrors Airbnb's condensed search. Clicking the
 * summary reopens the full form; the search affordance submits the current state.
 */
export function CatalogFilterCompactBar({
  filters: f,
  onExpand,
}: {
  filters: CatalogFilters;
  onExpand: () => void;
}) {
  const t = useTranslations("Catalog.filters");

  const locationLabel =
    f.locationOptions.find((o) => o.value === f.city)?.label ?? t("anyLocation");
  const typeLabel =
    f.propertyTypeOptions.find((o) => o.value === f.type)?.label ?? t("anyType");
  // Mirrors the expanded form: with a single deal type the segment would read
  // "Deal type" forever, so it is left out rather than shown as dead text.
  const dealLabel =
    f.deal && f.deal !== "any"
      ? f.getDealLabel(f.deal)
      : f.showDealFilter
        ? t("dealType")
        : null;

  const segments = [locationLabel, typeLabel, dealLabel, f.priceDisplay].filter(
    (seg): seg is string => Boolean(seg),
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand();
        }
      }}
      aria-label={t("filtersShort")}
      className={cn(
        // No own glass background: the shared GLASS surface in
        // CatalogFilterCollapse backs this pill, so the blur stays stable while
        // the pill content cross-fades on top. Only layout + focus ring here.
        "flex min-h-12 w-full cursor-pointer items-center gap-2 rounded-full p-1.5 pl-5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-dark dark:text-white">
        {segments.map((seg, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span
                aria-hidden
                className="h-1 w-1 shrink-0 rounded-full bg-dark/25 dark:bg-white/30"
              />
            )}
            <span className="min-w-0 truncate">{seg}</span>
          </React.Fragment>
        ))}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          f.handleSubmit(e as unknown as React.FormEvent);
        }}
        aria-label={t("search")}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        <Icon icon="ph:magnifying-glass-bold" width={18} height={18} aria-hidden />
      </button>
    </div>
  );
}
