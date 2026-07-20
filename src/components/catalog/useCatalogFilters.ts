"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { buildListingUrl } from "@/lib/routes/listingRoutes";
import {
  type ViewMode,
  DEFAULT_VIEW_MODE,
  parseViewMode,
} from "@/lib/catalog/viewMode";
import { useCurrency } from "@/contexts/CurrencyContext";
import { convertFromBaseEur } from "@/lib/currency/convert";
import { formatMoney } from "@/lib/currency/format";
import {
  interpretPriceRangeState,
  formatPriceRangeDisplay,
} from "@/lib/catalog/priceRanges";
import {
  formatAreaRangeDisplay,
  interpretAreaRangeState,
} from "@/lib/catalog/areaRanges";
import { buildCatalogFilterUrl } from "@/lib/catalog/buildCatalogFilterUrl";
import { useCatalogFilterChrome } from "@/components/catalog/useCatalogFilterChrome";
import {
  type FilterOption,
} from "@/components/catalog/FilterSelect";
import {
  type FilterMultiOption,
} from "@/components/catalog/FilterMultiSelect";

export type Option = { value: string; label: string; countrySlug?: string };
export type DistrictOption = Option & { citySlug?: string };

export type PropertySearchBarProps = {
  locations: Option[];
  propertyTypes: Option[];
  dealTypeValues: readonly string[];
  districtOptions: DistrictOption[];
  priceRangesByDeal: Record<string, { min: number; max: number }>;
  defaultAreaRange: { min: number; max: number };
  amenityOptions: Option[];
  initialAgentSlug?: string;
  /** From URL on geo catalog routes, or derived server-side from `city.country`. */
  initialCountrySlug?: string;
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

export function useCatalogFilters(props: PropertySearchBarProps) {
  const {
    locations,
    propertyTypes,
    dealTypeValues,
    districtOptions: allDistricts,
    priceRangesByDeal,
    defaultAreaRange,
    amenityOptions,
    initialAgentSlug = "",
    initialCountrySlug = "",
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
  } = props;

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
  const {
    showAdvanced,
    setShowAdvanced,
    isCompact,
    collapsed,
    expandCompactFilters,
    mobileFilterModalOpen,
    setMobileFilterModalOpen,
    clientMounted,
    advancedInnerRef,
    advancedHeight,
  } = useCatalogFilterChrome();

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
    const url = buildCatalogFilterUrl({
      locale,
      currentSearch: searchParams.toString(),
      type,
      effectiveDeal,
      priceTuple: pv,
      priceRangesByDeal,
      areaValues,
      defaultAreaRange,
      beds,
      sort,
      amenities,
      pageSize,
      city,
      district,
      initialAgentSlug,
      initialCountrySlug,
      locations,
    });
    router.push(url);
  },
    [
      amenities,
      beds,
      city,
      deal,
      district,
      initialAgentSlug,
      initialCountrySlug,
      locations,
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

  const resetFilters = React.useCallback(() => {
    router.push(
      buildListingUrl({
        scope: "agent",
        locale,
        agentSlug: initialAgentSlug || "",
      })
    );
  }, [router, locale, initialAgentSlug]);

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
  // Direct-URL rentals: the hidden deal stays selectable as the CURRENT value so
  // the page keeps working, but is not offered once the user switches away.
  if (deal && !dealTypeValues.includes(deal)) {
    dealTypeOptions.push({ value: deal, label: getDealLabel(deal) });
  }
  const amenityMultiOptions: FilterMultiOption[] = amenityOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return {
    dealTypeValues,
    defaultAreaRange,
    viewModeFromProps,
    city,
    setCity,
    type,
    setType,
    deal,
    setDeal,
    beds,
    setBeds,
    district,
    setDistrict,
    sort,
    setSort,
    pageSize,
    setPageSize,
    amenities,
    setAmenities,
    showAdvanced,
    setShowAdvanced,
    isCompact,
    collapsed,
    expandCompactFilters,
    mobileFilterModalOpen,
    setMobileFilterModalOpen,
    clientMounted,
    advancedInnerRef,
    advancedHeight,
    currentRange,
    priceValues,
    setPriceValues,
    priceDisplay,
    areaValues,
    setAreaValues,
    areaDisplay,
    getDealLabel,
    districtOptionsFiltered,
    locationOptions,
    propertyTypeOptions,
    dealTypeOptions,
    amenityMultiOptions,
    applyCompactDealTab,
    handleSubmit,
    resetFilters,
  };
}

export type CatalogFilters = ReturnType<typeof useCatalogFilters>;
