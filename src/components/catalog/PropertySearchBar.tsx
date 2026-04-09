"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import {
  catalogFilterPath,
  catalogPath,
  dealQueryValueToRouteSegment,
  singleFilterPath,
} from "@/lib/routes/catalog";
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
  interpretPriceRangeState,
  formatPriceRangeDisplay,
  getPriceQueryParams,
} from "@/lib/catalog/priceRanges";
import {
  formatAreaRangeDisplay,
  getAreaQueryParams,
  interpretAreaRangeState,
} from "@/lib/catalog/areaRanges";
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

function districtSlugForPath(d: string | undefined): string | undefined {
  if (!d || d === "any") return undefined;
  return d;
}

type Props = {
  locations: Option[];
  propertyTypes: Option[];
  dealTypeValues: readonly string[];
  districtOptions: DistrictOption[];
  priceRangesByDeal: Record<string, { min: number; max: number }>;
  defaultAreaRange: { min: number; max: number };
  amenityOptions: Option[];
  initialAgentSlug?: string;
  initialCity?: string;
  initialType?: string;
  initialDealType?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialMinArea?: string;
  initialMaxArea?: string;
  initialBeds?: string;
  initialDistrict?: string;
  initialSort?: string;
  initialAmenities?: string[];
  initialPageSize?: string;
  initialView?: ViewMode;
  /** When inside CatalogViewProvider: use this instead of initialView for applyFilters; avoids rerender on view change */
  getCurrentView?: () => ViewMode;
};

export function PropertySearchBar({
  locations,
  propertyTypes,
  dealTypeValues,
  districtOptions: allDistricts,
  priceRangesByDeal,
  defaultAreaRange,
  amenityOptions,
  initialAgentSlug = "",
  initialCity = "",
  initialType = "",
  initialDealType = "",
  initialMinPrice = "",
  initialMaxPrice = "",
  initialMinArea = "",
  initialMaxArea = "",
  initialBeds = "",
  initialDistrict = "",
  initialSort = "",
  initialAmenities = [],
  initialPageSize = "24",
  initialView = DEFAULT_VIEW_MODE,
}: Props) {
  const viewModeFromProps = parseViewMode(initialView as string);
  const t = useTranslations("Catalog.filters");
  const { currency: activeCurrency, rates } = useCurrency();
  const locale = useLocale();
  const [city, setCity] = React.useState(initialCity);
  const [type, setType] = React.useState(initialType);
  const [deal, setDeal] = React.useState(initialDealType || "any");
  const [beds, setBeds] = React.useState(initialBeds || "any");
  const [district, setDistrict] = React.useState(initialDistrict || "any");
  const [sort, setSort] = React.useState(initialSort || "newest");
  const [pageSize, setPageSize] = React.useState(initialPageSize || "24");
  const [amenities, setAmenities] = React.useState<string[]>(initialAmenities);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [isCompact, setIsCompact] = React.useState(false);
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);
  const [mobileFilterModalOpen, setMobileFilterModalOpen] = React.useState(false);
  const [clientMounted, setClientMounted] = React.useState(false);
  const wasCompactRef = React.useRef(false);
  const advancedInnerRef = React.useRef<HTMLDivElement>(null);
  const [advancedHeight, setAdvancedHeight] = React.useState(0);

  React.useEffect(() => {
    function handleScroll() {
      const compact = window.scrollY > 50;
      // Collapse advanced only on transition into compact scroll state (not on every scroll while open).
      if (compact && !wasCompactRef.current) {
        setShowAdvanced(false);
      }
      wasCompactRef.current = compact;
      setIsCompact(compact);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    setClientMounted(true);
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobileViewport(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (!isMobileViewport && mobileFilterModalOpen) {
      setMobileFilterModalOpen(false);
    }
  }, [isMobileViewport, mobileFilterModalOpen]);

  React.useEffect(() => {
    if (!mobileFilterModalOpen || !isMobileViewport) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFilterModalOpen, isMobileViewport]);

  React.useEffect(() => {
    if (!mobileFilterModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileFilterModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileFilterModalOpen]);

  // useLayoutEffect: measure before paint so advanced row is not height 0 on first open (clipped / unclickable).
  React.useLayoutEffect(() => {
    const el = advancedInnerRef.current;
    if (!el) return;
    if (showAdvanced) {
      setAdvancedHeight(el.scrollHeight);
    } else {
      setAdvancedHeight(0);
    }
  }, [showAdvanced]);

  const currentDealKey = deal || "any";
  const currentRange = React.useMemo(
    () =>
      priceRangesByDeal[currentDealKey] ||
      priceRangesByDeal.any || { min: 0, max: 1_000_000 },
    [priceRangesByDeal, currentDealKey]
  );

  const hasInitialPriceFromQuery =
    (typeof initialMinPrice === "string" && initialMinPrice.trim().length > 0) ||
    (typeof initialMaxPrice === "string" && initialMaxPrice.trim().length > 0);

  const [priceValues, setPriceValues] = React.useState<[number, number]>(() => {
    const fromMin = Number(initialMinPrice) || currentRange.min;
    const fromMax = Number(initialMaxPrice) || currentRange.max;
    return [fromMin, fromMax];
  });
  const didInitDealRef = React.useRef(false);

  const priceRangeState = React.useMemo(
    () =>
      interpretPriceRangeState(
        { min: priceValues[0], max: priceValues[1] },
        currentRange
      ),
    [priceValues, currentRange]
  );

  const priceDisplay = React.useMemo(() => {
    const formatAmount = (eur: number) =>
      formatMoney(convertFromBaseEur(eur, activeCurrency, rates), activeCurrency, locale);
    return formatPriceRangeDisplay(priceRangeState, { formatAmount, t });
  }, [priceRangeState, activeCurrency, rates, locale, t]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal]);

  const [areaValues, setAreaValues] = React.useState<[number, number]>(() => {
    const fromMin = Number(initialMinArea) || defaultAreaRange.min;
    const fromMax = Number(initialMaxArea) || defaultAreaRange.max;
    return [fromMin, fromMax];
  });

  const areaRangeState = React.useMemo(
    () =>
      interpretAreaRangeState(
        { min: areaValues[0], max: areaValues[1] },
        defaultAreaRange
      ),
    [areaValues, defaultAreaRange]
  );

  const areaDisplay = React.useMemo(
    () =>
      formatAreaRangeDisplay(areaRangeState, {
        t: (key) => t(key),
        unit: t("areaUnit"),
      }),
    [areaRangeState, t]
  );

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

  const initialAmenitiesKey = initialAmenities.join(",");

  React.useEffect(() => {
    setBeds(initialBeds || "any");
    setDistrict(initialDistrict || "any");
    setSort(initialSort || "newest");
    setPageSize(initialPageSize || "24");
    setAmenities(
      Array.isArray(initialAmenities) && initialAmenities.length > 0
        ? [...initialAmenities]
        : []
    );
    setAreaValues([
      Number(initialMinArea) || defaultAreaRange.min,
      Number(initialMaxArea) || defaultAreaRange.max,
    ]);
    // initialAmenities: synced when initialAmenitiesKey changes (stable vs parent array identity)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialAmenities read from props; key avoids loop
  }, [
    initialAmenitiesKey,
    initialBeds,
    initialDistrict,
    initialPageSize,
    initialSort,
    initialMinArea,
    initialMaxArea,
    defaultAreaRange.min,
    defaultAreaRange.max,
  ]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const applyFilters = React.useCallback(
    (opts?: {
      /** Compact mobile deal tabs only: apply before React state commits */
      dealForQuery?: string;
      priceTupleOverride?: [number, number];
    }) => {
    const effectiveDeal = opts?.dealForQuery ?? deal;
    const pv: [number, number] = opts?.priceTupleOverride ?? priceValues;
    const rangeForDeal =
      priceRangesByDeal[effectiveDeal || "any"] ||
      priceRangesByDeal.any || { min: 0, max: 1_000_000 };
    const priceStateForApply = interpretPriceRangeState(
      { min: pv[0], max: pv[1] },
      rangeForDeal
    );

    const params = new URLSearchParams(searchParams.toString());

    if (type) params.set("type", type);
    else params.delete("type");

    if (effectiveDeal && effectiveDeal !== "any") params.set("deal", effectiveDeal);
    else params.delete("deal");

    const priceParams = getPriceQueryParams(priceStateForApply);
    if (priceParams.minPrice) params.set("minPrice", priceParams.minPrice);
    else params.delete("minPrice");
    if (priceParams.maxPrice) params.set("maxPrice", priceParams.maxPrice);
    else params.delete("maxPrice");

    const areaStateForApply = interpretAreaRangeState(
      { min: areaValues[0], max: areaValues[1] },
      defaultAreaRange
    );
    const areaParams = getAreaQueryParams(areaStateForApply);
    if (areaParams.minArea) params.set("minArea", areaParams.minArea);
    else params.delete("minArea");
    if (areaParams.maxArea) params.set("maxArea", areaParams.maxArea);
    else params.delete("maxArea");

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
    // District in path when city is set; when no city, catalogPath carries ?district= (do not duplicate in params)
    params.delete("district");

    const citySlug = city || undefined;
    const dealSegment = dealQueryValueToRouteSegment(
      effectiveDeal && effectiveDeal !== "any" ? effectiveDeal : undefined
    );
    const typeSlug = type || undefined;
    const singleCount = Number(Boolean(citySlug)) + Number(Boolean(dealSegment)) + Number(Boolean(typeSlug));
    const path =
      !initialAgentSlug && singleCount === 1
        ? singleFilterPath({
            locale,
            city: citySlug,
            dealType: dealSegment || undefined,
            propertyType: typeSlug,
          })
        : citySlug && !initialAgentSlug
        ? catalogFilterPath({
            locale,
            city: citySlug,
            dealType: dealSegment || undefined,
            propertyType: typeSlug,
            district: districtSlugForPath(district),
          })
        : catalogPath(
            locale,
            citySlug,
            districtSlugForPath(district),
            initialAgentSlug || undefined
          );
    // Keep query params only for filters that are not encoded in the path.
    if (citySlug) params.delete("city");
    if (dealSegment && path.includes(`/${encodeURIComponent(dealSegment)}`)) params.delete("deal");
    if (typeSlug && path.includes(`/${encodeURIComponent(typeSlug)}`)) params.delete("type");
    const qs = params.toString();
    const url =
      qs === ""
        ? path
        : path.includes("?")
          ? `${path}&${qs}`
          : `${path}?${qs}`;
    router.push(url);
  },
    [
      amenities,
      beds,
      city,
      deal,
      district,
      initialAgentSlug,
      locale,
      pageSize,
      areaValues,
      defaultAreaRange,
      priceRangesByDeal,
      priceValues,
      router,
      searchParams,
      sort,
      type,
    ]
  );

  const applyCompactDealTab = React.useCallback(
    (nextRaw: string) => {
      const next = nextRaw === "any" || nextRaw === "" ? "any" : nextRaw;
      const range =
        priceRangesByDeal[next === "any" ? "any" : next] ||
        priceRangesByDeal.any || { min: 0, max: 1_000_000 };
      const tuple: [number, number] = [range.min, range.max];
      setDeal(next);
      setPriceValues(tuple);
      applyFilters({ dealForQuery: next, priceTupleOverride: tuple });
    },
    [applyFilters, priceRangesByDeal]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
    setMobileFilterModalOpen(false);
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

  const renderFilterForm = (placement: "inline" | "modal") => (
    <form
      onSubmit={handleSubmit}
      className={cn(
        placement === "inline"
          ? cn(
              "mb-6 flex min-w-0 flex-col rounded-2xl border border-dark/10 bg-white/55 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-dark/55",
              "px-4 sm:px-6",
              isCompact ? "gap-3 py-3 sm:py-4" : "gap-4 py-4 sm:py-5"
            )
          : "mb-0 flex min-h-0 w-full min-w-0 max-w-full flex-col gap-4 rounded-none border-0 bg-transparent px-0 py-0 shadow-none"
      )}
    >
      {/* BASIC FILTERS */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 items-end min-w-0",
          "md:grid-cols-4",
          "xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_auto_auto]",
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
              {priceDisplay}
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
            onClick={() => router.push(catalogPath(locale, undefined, undefined, initialAgentSlug || undefined))}
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
            <span className="inline-block max-w-full truncate">
              {t("advancedFilters")}
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
          "will-change-[height] transition-[height] duration-300 ease-out",
          // overflow-visible while open: FilterSelect panels are position:absolute below the trigger;
          // advancedHeight is measured with menus closed, so overflow-hidden clips open menus.
          showAdvanced ? "overflow-visible" : "overflow-hidden"
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
          <div className="flex flex-col gap-3 min-w-0">
            {/* Select / display controls — single grid rhythm */}
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

            {/* Area (m²) — separate block below selects; not mixed into the dropdown grid */}
            <div className="min-w-0 w-1/2 max-w-full md:max-w-2xl pt-3 border-t border-dark/5 dark:border-white/10">
              <div className="flex items-center justify-between gap-2 text-xs text-dark/70 dark:text-white/80 mb-1 min-w-0">
                <span className="min-w-0 truncate">{t("area")}</span>
                <span className="font-medium text-dark dark:text-white text-[11px] min-w-0 truncate text-right">
                  {areaDisplay}
                </span>
              </div>
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-4"
                min={defaultAreaRange.min}
                max={defaultAreaRange.max}
                step={1}
                value={areaValues}
                onValueChange={(values) => {
                  const [min, max] = values as [number, number];
                  setAreaValues([min, max]);
                }}
              >
                <Slider.Track className="bg-dark/10 dark:bg-white/20 relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-primary rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block size-4 rounded-full border border-white bg-primary shadow cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <Slider.Thumb className="block size-4 rounded-full border border-white bg-primary shadow cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </Slider.Root>
            </div>
          </div>
        </div>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobile: single compact row — deal tabs + filters icon (md:hidden). Modal toggle preserves existing portal/handlers. */}
      <div
        className={cn(
          "mb-5 min-w-0 rounded-2xl border px-2.5 py-2 shadow-md backdrop-blur-md md:hidden",
          "border-dark/10 bg-white/55 dark:border-white/10 dark:bg-dark/55"
        )}
      >
        <div className="flex min-h-[2.25rem] min-w-0 w-full items-stretch overflow-hidden rounded-full bg-dark/[0.07] p-0.5 dark:bg-white/[0.08]">
          <div
            className="flex min-h-9 min-w-0 flex-1 items-stretch"
            role="group"
            aria-label={t("dealType")}
          >
            {dealTypeValues.map((v) => (
              <div
                key={v}
                className="flex min-h-9 min-w-0 flex-1 items-stretch overflow-hidden border-r border-dark/10 dark:border-white/10"
              >
                <button
                  type="button"
                  onClick={() => applyCompactDealTab(v)}
                  className={cn(
                    "flex min-h-9 min-w-0 w-full max-w-full items-center justify-center px-1 py-1 text-center text-[11px] font-medium leading-tight transition-colors sm:text-xs",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
                    deal === v
                      ? "rounded-full bg-white text-dark shadow-sm ring-1 ring-dark/10 dark:bg-dark dark:text-white dark:ring-white/15"
                      : "rounded-full text-dark/70 ring-1 ring-transparent hover:bg-dark/10 hover:ring-dark/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:ring-white/10"
                  )}
                >
                  <span className="min-w-0 max-w-full truncate px-0.5">{getDealLabel(v)}</span>
                </button>
              </div>
            ))}
          </div>
          <div className="flex min-h-9 shrink-0 items-stretch pl-0.5">
            <button
              type="button"
              onClick={() => setMobileFilterModalOpen((o) => !o)}
              aria-label={
                mobileFilterModalOpen ? t("closeModal") : t("mobileSearchOpen")
              }
              aria-expanded={mobileFilterModalOpen}
              className={cn(
                "flex h-full min-h-9 min-w-9 max-w-[2.25rem] shrink-0 items-center justify-center rounded-full transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
                mobileFilterModalOpen
                  ? "bg-white text-primary shadow-sm ring-1 ring-dark/10 dark:bg-dark dark:text-primary dark:ring-white/15"
                  : "text-dark/70 hover:bg-dark/10 dark:text-white/70 dark:hover:bg-white/10"
              )}
            >
              <Icon icon="ph:magnifying-glass" width={18} height={18} aria-hidden />
            </button>
          </div>
        </div>
      </div>
      {/* Desktop/tablet inline form only (md+). Hidden on mobile via CSS — same HTML on SSR/client, no hydration mismatch. */}
      <div className="hidden min-w-0 md:block">{renderFilterForm("inline")}</div>
      {clientMounted &&
        mobileFilterModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99] flex flex-col justify-end md:hidden"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label={t("closeModal")}
              onClick={() => setMobileFilterModalOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-filter-modal-title"
              className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-dark/10 bg-white shadow-xl dark:border-white/10 dark:bg-dark"
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-dark/10 px-4 py-3 dark:border-white/10">
                <h2
                  id="catalog-filter-modal-title"
                  className="truncate text-lg font-semibold text-dark dark:text-white"
                >
                  {t("filtersShort")}
                </h2>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-dark/70 transition-colors hover:bg-dark/5 dark:text-white/80 dark:hover:bg-white/10"
                  onClick={() => setMobileFilterModalOpen(false)}
                  aria-label={t("closeModal")}
                >
                  <Icon icon="ph:x" width={22} height={22} aria-hidden />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 pb-6 pt-2">
                {renderFilterForm("modal")}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
