"use client";

import * as React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import * as Slider from "@radix-ui/react-slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FilterSelect,
  type FilterOption,
} from "@/components/catalog/FilterSelect";
import {
  FilterMultiSelect,
  type FilterMultiOption,
} from "@/components/catalog/FilterMultiSelect";

type Option = { value: string; label: string };

type Props = {
  locations: Option[];
  propertyTypes: Option[];
  dealTypes: Option[];
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
};

export function PropertySearchBar({
  locations,
  propertyTypes,
  dealTypes,
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
}: Props) {
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

  const [priceValues, setPriceValues] = React.useState<[number, number]>(() => {
    const fromMin = Number(initialMinPrice) || currentRange.min;
    const fromMax = Number(initialMaxPrice) || currentRange.max;
    return [fromMin, fromMax];
  });

  React.useEffect(() => {
    // при смене типа сделки сбрасываем слайдер на диапазон для этого типа
    const range =
      priceRangesByDeal[deal || "any"] || priceRangesByDeal.any || currentRange;
    setPriceValues([range.min, range.max]);
    setMinPrice(range.min.toString());
    setMaxPrice(range.max.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const applyFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (city) params.set("city", city);
    else params.delete("city");

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

    if (district && district !== "any") params.set("district", district);
    else params.delete("district");

    if (sort && sort !== "newest") params.set("sort", sort);
    else params.delete("sort");

    if (amenities.length > 0) params.set("amenities", amenities.join(","));
    else params.delete("amenities");

    if (pageSize) params.set("pageSize", pageSize);
    else params.delete("pageSize");

    // reset page on new search
    params.delete("page");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [
    amenities,
    beds,
    city,
    deal,
    maxPrice,
    minPrice,
    pageSize,
    pathname,
    router,
    searchParams,
    sort,
    type,
    district,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const locationOptions: FilterOption[] = locations.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const propertyTypeOptions: FilterOption[] = propertyTypes.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const dealTypeOptions: FilterOption[] = dealTypes.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const amenityMultiOptions: FilterMultiOption[] = amenityOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-2xl border border-dark/10 dark:border-white/10 bg-white/80 dark:bg-dark/80 shadow-sm px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4"
    >
      {/* BASIC FILTERS */}
      <div
        className="
          grid gap-4 items-end
          md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]
        "
      >
        {/* Location */}
        <FilterSelect
          label="Location"
          value={city || "any"}
          onValueChange={(v) => setCity(v === "any" ? "" : v)}
          options={locationOptions}
          anyLabel="Any location"
        />

        {/* Property type */}
        <FilterSelect
          label="Property type"
          value={type || "any"}
          onValueChange={(v) => setType(v === "any" ? "" : v)}
          options={propertyTypeOptions}
          anyLabel="Any type"
        />

        {/* Deal type */}
        <FilterSelect
          label="Deal type"
          value={deal || "any"}
          onValueChange={setDeal}
          options={dealTypeOptions}
          anyLabel="Any"
        />

        {/* Price range (label + slider + values) */}
        <div>
          <div className="flex items-center justify-between text-xs text-dark/70 dark:text-white/80 mb-1">
            <span>Price range</span>
            <span className="font-medium text-dark dark:text-white text-[11px]">
              {priceValues[0].toLocaleString()} –{" "}
              {priceValues[1].toLocaleString()}
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
              setMinPrice(String(min));
              setMaxPrice(String(max));
            }}
          >
            <Slider.Track className="bg-dark/10 dark:bg-white/20 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb className="block size-4 rounded-full border border-white bg-primary shadow cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <Slider.Thumb className="block size-4 rounded-full border border-white bg-primary shadow cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </Slider.Root>
        </div>

        {/* Search + Advanced */}
        <div className="flex items-end gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 rounded-full cursor-pointer"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <span className="hidden sm:inline">Advanced filters</span>
            <span className="sm:hidden">Filters</span>
          </Button>
          <Button
            type="submit"
            className="h-10 px-6 rounded-full cursor-pointer"
          >
            Search
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
            "pt-4 pb-2 border-t border-dark/5 dark:border-white/10",
            "transition-[opacity,transform] duration-300 ease-out",
            showAdvanced ? "delay-75" : "delay-0",
            showAdvanced ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
          )}
        >
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
            {/* Bedrooms */}
            <FilterSelect
              label="Bedrooms"
              value={beds || "any"}
              onValueChange={setBeds}
              options={[
                { value: "1", label: "1+" },
                { value: "2", label: "2+" },
                { value: "3", label: "3+" },
                { value: "4", label: "4+" },
                { value: "5", label: "5+" },
              ]}
              anyLabel="Any"
            />

            {/* District */}
            <FilterSelect
              label="District"
              value={district || "any"}
              onValueChange={setDistrict}
              options={[]}
              anyLabel="Any district"
            />

            <FilterMultiSelect
              label="Amenities"
              value={amenities}
              onValueChange={setAmenities}
              options={amenityMultiOptions}
              summaryLabel={(count) =>
                count === 0 ? "Amenities" : `${count} selected`
              }
            />

            {/* Sort */}
            <FilterSelect
              label="Sort by"
              value={sort || "newest"}
              onValueChange={setSort}
              anyLabel="Newest"
              anyValue="newest"
              options={[
                { value: "priceAsc", label: "Price (low to high)" },
                { value: "priceDesc", label: "Price (high to low)" },
                { value: "areaDesc", label: "Area (largest first)" },
              ]}
            />

            {/* Results per page */}
            <FilterSelect
              label="Results per page"
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
          </div>
        </div>
      </div>
    </form>
  );
}
