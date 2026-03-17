"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { catalogPath } from "@/lib/routes/catalog";
import { FilterSelect, type FilterOption } from "@/components/catalog/FilterSelect";
import * as Slider from "@radix-ui/react-slider";
import { useCurrency } from "@/contexts/CurrencyContext";
import { convertFromBaseEur, convertToBaseEur } from "@/lib/currency/convert";
import { formatMoney } from "@/lib/currency/format";

type DealTab = "sale" | "rent" | "short-term";

const DEAL_TABS: DealTab[] = ["sale", "rent", "short-term"];

const DEFAULT_RANGES_EUR: Record<DealTab | "any", { min: number; max: number }> = {
  any: { min: 50_000, max: 1_000_000 },
  sale: { min: 50_000, max: 1_000_000 },
  rent: { min: 300, max: 10_000 },
  "short-term": { min: 50, max: 2_000 },
};

export function HeroSearchBlock({
  locationOptions,
  propertyTypeOptions,
}: {
  locationOptions: FilterOption[];
  propertyTypeOptions: FilterOption[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const tHero = useTranslations("Home.hero");
  const tFilters = useTranslations("Catalog.filters");

  const { currency, rates } = useCurrency();

  const [deal, setDeal] = React.useState<DealTab>("sale");
  const [city, setCity] = React.useState<string>("any");
  const [type, setType] = React.useState<string>("any");

  const range = DEFAULT_RANGES_EUR[deal] ?? DEFAULT_RANGES_EUR.any;
  const [priceValuesEur, setPriceValuesEur] = React.useState<[number, number]>([
    range.min,
    range.max,
  ]);

  React.useEffect(() => {
    const next = DEFAULT_RANGES_EUR[deal] ?? DEFAULT_RANGES_EUR.any;
    setPriceValuesEur([next.min, next.max]);
  }, [deal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    params.set("deal", deal);

    if (city && city !== "any") params.set("city", city);
    if (type && type !== "any") params.set("type", type);

    const [minEur, maxEur] = priceValuesEur;
    if (Number.isFinite(minEur) && minEur > 0) params.set("minPrice", String(Math.round(minEur)));
    if (Number.isFinite(maxEur) && maxEur > 0) params.set("maxPrice", String(Math.round(maxEur)));

    router.push(`${catalogPath(locale)}?${params.toString()}`);
  };

  const [minEur, maxEur] = priceValuesEur;
  const minDisplay = formatMoney(convertFromBaseEur(minEur, currency, rates), currency, locale);
  const maxDisplay = formatMoney(convertFromBaseEur(maxEur, currency, rates), currency, locale);

  const onSliderValueChange = (values: number[]) => {
    const [min, max] = values as [number, number];
    // Slider operates in active currency units; convert back to base EUR for query.
    const minEurNext = convertToBaseEur(min, currency, rates);
    const maxEurNext = convertToBaseEur(max, currency, rates);
    setPriceValuesEur([minEurNext, maxEurNext]);
  };

  const sliderMin = convertFromBaseEur(range.min, currency, rates);
  const sliderMax = convertFromBaseEur(range.max, currency, rates);
  const sliderValue: [number, number] = [
    convertFromBaseEur(priceValuesEur[0], currency, rates),
    convertFromBaseEur(priceValuesEur[1], currency, rates),
  ];

  return (
    <div
      className={cn(
        "w-full max-w-3xl mx-auto",
        "rounded-2xl border border-white/20 dark:border-dark/20",
        "bg-white/90 dark:bg-dark/80 backdrop-blur-md shadow-3xl",
        "p-3 sm:p-4"
      )}
    >
      {/* Tabs */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-dark/5 dark:bg-white/10 p-1.5 ring-1 ring-dark/5 dark:ring-white/10">
        {DEAL_TABS.map((tab) => {
          const active = tab === deal;
          const label =
            tab === "sale"
              ? tHero("search.tabs.buy")
              : tab === "rent"
                ? tHero("search.tabs.rent")
                : tHero("search.tabs.shortTerm");
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setDeal(tab)}
              className={cn(
                "h-9 px-4 rounded-full font-semibold text-sm min-w-0",
                "transition-[background-color,color,box-shadow] duration-200 ease-out cursor-pointer",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
                active
                  ? "bg-white dark:bg-dark text-dark dark:text-white shadow-sm ring-1 ring-dark/5 dark:ring-white/10"
                  : "text-dark/70 dark:text-white/70 hover:bg-dark/10 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white"
              )}
            >
              <span className="block max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters row */}
      <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-3 items-end min-w-0 [&>*]:min-w-0">
        <FilterSelect
          label={tFilters("location")}
          value={city}
          onValueChange={setCity}
          options={locationOptions}
          anyLabel={tFilters("anyLocation")}
        />
        <FilterSelect
          label={tFilters("propertyType")}
          value={type}
          onValueChange={setType}
          options={propertyTypeOptions}
          anyLabel={tFilters("anyType")}
        />

        <div className="min-w-0">
          <div className="flex items-center justify-between text-xs text-dark/70 dark:text-white/80 mb-1 min-w-0">
            <span className="truncate">{tFilters("priceRange")}</span>
            <span className="font-medium text-dark dark:text-white text-[11px] shrink-0">
              {minDisplay} – {maxDisplay}
            </span>
          </div>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-4"
            min={sliderMin}
            max={sliderMax}
            step={deal === "sale" ? 5_000 : deal === "rent" ? 50 : 10}
            value={sliderValue}
            onValueChange={onSliderValueChange}
          >
            <Slider.Track className="bg-dark/10 dark:bg-white/20 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb className="block size-4 rounded-full border border-white bg-primary shadow cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <Slider.Thumb className="block size-4 rounded-full border border-white bg-primary shadow cursor-pointer transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </Slider.Root>
        </div>

        <button
          type="submit"
          className={cn(
            "h-10 px-6 rounded-full font-semibold",
            "bg-primary text-white hover:bg-dark dark:hover:bg-white dark:hover:text-dark",
            "transition-colors duration-200 ease-out cursor-pointer",
            "w-full lg:w-auto"
          )}
        >
          {tFilters("search")}
        </button>
      </form>
    </div>
  );
}

