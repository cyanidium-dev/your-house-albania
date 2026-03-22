"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { catalogPath } from "@/lib/routes/catalog";
import {
  type ViewMode,
  DEFAULT_VIEW_MODE,
  parseViewMode,
} from "@/lib/catalog/viewMode";
import { useCatalogViewOptional } from "@/contexts/CatalogViewContext";
import * as Slider from "@radix-ui/react-slider";

function ViewModeSwitcherUI({
  fallbackViewMode,
  fallbackSetViewMode,
}: {
  fallbackViewMode: ViewMode;
  fallbackSetViewMode: (view: ViewMode) => void;
}) {
  const ctx = useCatalogViewOptional();
  const viewMode = ctx?.viewMode ?? fallbackViewMode;
  const setViewMode = ctx?.setViewMode ?? fallbackSetViewMode;
  const t = useTranslations("Catalog.filters");
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium text-dark/70 dark:text-white/80">
        {t("viewLabel")}
      </p>
      <div className="flex items-center justify-start">
        <div className="inline-flex gap-0.5 rounded-full p-0.5 bg-dark/5 dark:bg-white/10">
        <button
          type="button"
          onClick={() => setViewMode("large")}
          title={t("viewLarge")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-dark/70 dark:text-white/70 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            viewMode === "large"
              ? "bg-white dark:bg-dark text-dark dark:text-white shadow-sm"
              : "hover:bg-dark/10 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white"
          )}
          aria-pressed={viewMode === "large"}
        >
          <Icon icon="ph:square" width={18} height={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("small")}
          title={t("viewSmall")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-dark/70 dark:text-white/70 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            viewMode === "small"
              ? "bg-white dark:bg-dark text-dark dark:text-white shadow-sm"
              : "hover:bg-dark/10 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white"
          )}
          aria-pressed={viewMode === "small"}
        >
          <Icon icon="ph:squares-four" width={18} height={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("list")}
          title={t("viewList")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-dark/70 dark:text-white/70 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            viewMode === "list"
              ? "bg-white dark:bg-dark text-dark dark:text-white shadow-sm"
              : "hover:bg-dark/10 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white"
          )}
          aria-pressed={viewMode === "list"}
        >
          <Icon icon="ph:list" width={18} height={18} aria-hidden />
        </button>
        </div>
      </div>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { convertFromBaseEur } from "@/lib/currency/convert";
import { formatMoney } from "@/lib/currency/format";
import {
  FilterSelect,
  type FilterOption,
} from "@/components/catalog/FilterSelect";
import {
  FilterMultiSelect,
  type FilterMultiOption,
} from "@/components/catalog/FilterMultiSelect";

type Option = { value: string; label: string };
type DistrictOption = Option & { citySlug?: string };

type Props = {
  locations: Option[];
  propertyTypes: Option[];
  dealTypeValues: readonly string[];
  districtOptions: DistrictOption[];
  priceRangesByDeal: Record<string, { min: number; max: number }>;
  amenityOptions: Option[];
  initialCity?: string;
  initialType?: string;
  initialDealType?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialBeds?: string;
  initialDistrict?: string;
  initialSort?: string;
  initialAmenities?: string[];
  initialPageSize?: string;
  initialView?: ViewMode;
  /** When inside CatalogViewProvider: use this instead of initialView for applyFilters; avoids rerender on view change */
  getCurrentView?: () => ViewMode;
};

function PropertySearchBarInner({
  locations,
  propertyTypes,
  dealTypeValues,
  districtOptions: allDistricts,
  priceRangesByDeal,
  amenityOptions,
  initialCity = "",
  initialType = "",
  initialDealType = "",
  initialMinPrice = "",
  initialMaxPrice = "",
  initialBeds = "",
  initialDistrict = "",
  initialSort = "",
  initialAmenities = [],
  initialPageSize = "24",
  initialView = DEFAULT_VIEW_MODE,
  getCurrentView,
}: Props) {
  const viewModeFromProps = parseViewMode(initialView as string);
  const t = useTranslations("Catalog.filters");
  const { currency: activeCurrency, rates } = useCurrency();
  const locale = useLocale();
  const [city, setCity] = React.useState(initialCity);
  const [type, setType] = React.useState(initialType);
  const [deal, setDeal] = React.useState(initialDealType || "any");
  const [minPrice, setMinPrice] = React.useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = React.useState(initialMaxPrice);
  const [beds, setBeds] = React.useState(initialBeds || "any");
  const [district, setDistrict] = React.useState(initialDistrict || "any");
  const [sort, setSort] = React.useState(initialSort || "newest");
  const [pageSize, setPageSize] = React.useState(initialPageSize || "24");
  const [amenities, setAmenities] = React.useState<string[]>(initialAmenities);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const advancedInnerRef = React.useRef<HTMLDivElement>(null);
  const [advancedHeight, setAdvancedHeight] = React.useState(0);
  React.useEffect(() => {
    const el = advancedInnerRef.current;
    if (!el) return;
    // Measure only when open/close toggles to avoid continuous layout thrash
    if (showAdvanced) {
      setAdvancedHeight(el.scrollHeight);
    } else {
      setAdvancedHeight(0);
    }
  }, [showAdvanced]);

  const currentDealKey = deal || "any";
  const currentRange = priceRangesByDeal[currentDealKey] ||
    priceRangesByDeal.any || { min: 0, max: 1_000_000 };

  const hasInitialPriceFromQuery =
    (typeof initialMinPrice === "string" && initialMinPrice.trim().length > 0) ||
    (typeof initialMaxPrice === "string" && initialMaxPrice.trim().length > 0);

  const [priceValues, setPriceValues] = React.useState<[number, number]>(() => {
    const fromMin = Number(initialMinPrice) || currentRange.min;
    const fromMax = Number(initialMaxPrice) || currentRange.max;
    return [fromMin, fromMax];
  });
  const didInitDealRef = React.useRef(false);

  const priceIsDefaultNoFilter = React.useMemo(() => {
    const [min, max] = priceValues;
    return min <= currentRange.min && max >= currentRange.max;
  }, [priceValues, currentRange.min, currentRange.max]);

  React.useEffect(() => {
    const range =
      priceRangesByDeal[deal || "any"] || priceRangesByDeal.any || currentRange;
    if (!didInitDealRef.current) {
      didInitDealRef.current = true;
      if (hasInitialPriceFromQuery) {
        // Preserve URL-provided range on first mount.
        return;
      }
    }
    // Deal changed explicitly -> reset to no-price-filter state.
    setPriceValues([range.min, range.max]);
    setMinPrice("");
    setMaxPrice("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal]);

  const getDealLabel = (value: string) => {
    if (value === "sale") return t("dealSale");
    if (value === "rent") return t("dealRent");
    if (value === "short-term") return t("dealShortTerm");
    return value;
  };

  const districtOptionsFiltered = React.useMemo(() => {
    if (!city) return allDistricts;
    return allDistricts.filter(
      (d) => !d.citySlug || d.citySlug === city
    );
  }, [allDistricts, city]);

  React.useEffect(() => {
    const currentDistrict = district === "any" ? "" : district;
    if (currentDistrict && districtOptionsFiltered.length > 0) {
      const belongsToCity = districtOptionsFiltered.some(
        (d) => d.value === currentDistrict
      );
      if (!belongsToCity) setDistrict("any");
    }
  }, [city, district, districtOptionsFiltered]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const applyFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (type) params.set("type", type);
    else params.delete("type");

    if (deal && deal !== "any") params.set("deal", deal);
    else params.delete("deal");

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    if (beds && beds !== "any") params.set("beds", beds);
    else params.delete("beds");

    if (sort && sort !== "newest") params.set("sort", sort);
    else params.delete("sort");

    if (amenities.length > 0) params.set("amenities", amenities.join(","));
    else params.delete("amenities");

    if (pageSize) params.set("pageSize", pageSize);
    else params.delete("pageSize");

    // View mode is UI preference (localStorage), not part of search/filter query
    params.delete("view");
    params.delete("page");
    params.delete("city");
    params.delete("district");

    const qs = params.toString();
    const path = catalogPath(locale, city || undefined, district && district !== "any" ? district : undefined);
    router.push(qs ? `${path}?${qs}` : path);
  }, [
    amenities,
    beds,
    city,
    deal,
    district,
    locale,
    maxPrice,
    minPrice,
    pageSize,
    router,
    searchParams,
    sort,
    type,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const locationOptions: FilterOption[] = locations.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const propertyTypeOptions: FilterOption[] = propertyTypes
    .filter((o) => o.value && o.value !== "any")
    .map((o) => ({ value: o.value, label: o.label }));
  const dealTypeOptions: FilterOption[] = dealTypeValues.map((v) => ({
    value: v,
    label: getDealLabel(v),
  }));
  const amenityMultiOptions: FilterMultiOption[] = amenityOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-dark/10 dark:border-white/10 bg-white/80 dark:bg-dark/80 shadow-sm px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4 min-w-0"
    >
      {/* BASIC FILTERS */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 items-end min-w-0",
          "md:grid-cols-4",
          "xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]",
          "[&>*]:min-w-0"
        )}
      >
        {/* Location */}
        <FilterSelect
          label={t("location")}
          value={city || "any"}
          onValueChange={(v) => {
            setCity(v === "any" ? "" : v);
          }}
          options={locationOptions}
          anyLabel={t("anyLocation")}
        />

        {/* Property type */}
        <FilterSelect
          label={t("propertyType")}
          value={type || "any"}
          onValueChange={(v) => setType(v === "any" ? "" : v)}
          options={propertyTypeOptions}
          anyLabel={t("anyType")}
        />

        {/* Deal type */}
        <FilterSelect
          label={t("dealType")}
          value={deal || "any"}
          onValueChange={setDeal}
          options={dealTypeOptions}
          anyLabel={t("any")}
        />

        {/* Price range (label + slider + values) */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs text-dark/70 dark:text-white/80 mb-1 min-w-0">
            <span className="min-w-0 truncate">{t("priceRange")}</span>
            <span className="font-medium text-dark dark:text-white text-[11px] min-w-0 truncate text-right">
              {priceIsDefaultNoFilter
                ? t("any")
                : `${formatMoney(convertFromBaseEur(priceValues[0], activeCurrency, rates), activeCurrency, locale)} – ${formatMoney(convertFromBaseEur(priceValues[1], activeCurrency, rates), activeCurrency, locale)}`}
            </span>
          </div>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-4"
            min={currentRange.min}
            max={currentRange.max}
            step={1000}
            value={priceValues}
            onValueChange={(values) => {
              const [min, max] = values as [number, number];
              setPriceValues([min, max]);
              const minChanged = min > currentRange.min;
              const maxChanged = max < currentRange.max;
              setMinPrice(minChanged ? String(min) : "");
              setMaxPrice(maxChanged ? String(max) : "");
            }}
          >
            <Slider.Track className="bg-dark/10 dark:bg-white/20 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb className="block size-4 rounded-full border border-white bg-primary shadow cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <Slider.Thumb className="block size-4 rounded-full border border-white bg-primary shadow cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </Slider.Root>
        </div>

        {/* Reset + Advanced + Search */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-2 justify-end min-w-0 md:col-span-4 xl:col-span-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 rounded-full cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 dark:hover:bg-primary/10 dark:hover:text-primary dark:hover:border-primary/30 w-full sm:w-auto shrink-0"
            onClick={() => router.push(catalogPath(locale))}
          >
            <span className="inline-block max-w-full truncate">
              {t("resetFilters")}
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 rounded-full cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 dark:hover:bg-primary/10 dark:hover:text-primary dark:hover:border-primary/30 w-full sm:w-auto shrink-0"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <span className="hidden sm:inline max-w-full truncate">
              {t("advancedFilters")}
            </span>
            <span className="sm:hidden max-w-full truncate">
              {t("filtersShort")}
            </span>
          </Button>
          <Button
            type="submit"
            className="h-10 px-6 rounded-full cursor-pointer w-full sm:w-auto shrink-0"
          >
            {t("search")}
          </Button>
        </div>
      </div>

      {/* ADVANCED FILTERS */}
      <div
        aria-hidden={!showAdvanced}
        style={{ height: showAdvanced ? advancedHeight : 0 }}
        className={cn(
          "overflow-hidden will-change-[height] transition-[height] duration-300 ease-out"
        )}
      >
        <div
          ref={advancedInnerRef}
          className={cn(
            "pt-4 pb-1 border-t border-dark/5 dark:border-white/10",
            "transition-[opacity,transform] duration-300 ease-out",
            showAdvanced ? "delay-75" : "delay-0",
            showAdvanced ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
          )}
        >
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 min-w-0 [&>*]:min-w-0">
            {/* Bedrooms */}
            <FilterSelect
              label={t("bedrooms")}
              value={beds || "any"}
              onValueChange={setBeds}
              options={[
                { value: "1", label: t("bedsAtLeast", { count: 1 }) },
                { value: "2", label: t("bedsAtLeast", { count: 2 }) },
                { value: "3", label: t("bedsAtLeast", { count: 3 }) },
                { value: "4", label: t("bedsAtLeast", { count: 4 }) },
                { value: "5", label: t("bedsAtLeast", { count: 5 }) },
              ]}
              anyLabel={t("any")}
            />

            {/* District */}
            <FilterSelect
              label={t("district")}
              value={district || "any"}
              onValueChange={(v) => setDistrict(v === "any" ? "" : v)}
              options={districtOptionsFiltered.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              anyLabel={t("anyDistrict")}
            />

            <FilterMultiSelect
              label={t("amenities")}
              value={amenities}
              onValueChange={setAmenities}
              options={amenityMultiOptions}
              summaryLabel={(count) =>
                count === 0
                  ? t("amenities")
                  : t("amenitiesSelected", { count })
              }
            />

            {/* Sort */}
            <FilterSelect
              label={t("sortBy")}
              value={sort || "newest"}
              onValueChange={setSort}
              anyLabel={t("sortNewest")}
              anyValue="newest"
              options={[
                { value: "priceAsc", label: t("sortPriceAsc") },
                { value: "priceDesc", label: t("sortPriceDesc") },
                { value: "areaDesc", label: t("sortAreaDesc") },
              ]}
            />

            {/* Results per page */}
            <FilterSelect
              label={t("resultsPerPage")}
              value={pageSize || "24"}
              onValueChange={setPageSize}
              anyLabel="24"
              anyValue="24"
              options={[
                { value: "12", label: "12" },
                { value: "36", label: "36" },
                { value: "48", label: "48" },
              ]}
            />
            {/* View mode switcher: presentation control for results row */}
            <ViewModeSwitcherUI
              fallbackViewMode={viewModeFromProps}
              fallbackSetViewMode={() => {}}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

export const PropertySearchBar = React.memo(PropertySearchBarInner);
