"use client";

import { useTranslations } from "next-intl";
import * as Slider from "@radix-ui/react-slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FilterSelect } from "@/components/catalog/FilterSelect";
import { FilterMultiSelect } from "@/components/catalog/FilterMultiSelect";
import { ViewModeSwitcherUI } from "@/components/catalog/ViewModeSwitcherUI";
import type { CatalogFilters } from "@/components/catalog/useCatalogFilters";

/**
 * Range slider rendered as a first-class field: same height/radius/border as the
 * dropdowns so price + area sit inline with the rest of the composition instead
 * of hanging as a naked track. Bigger thumbs + a minimum gap keep both handles
 * grabbable (and prevent them overlapping) even on a wide range like 30–500 m².
 */
function RangeField({
  label,
  valueDisplay,
  min,
  max,
  step,
  value,
  onValueChange,
}: {
  label: string;
  valueDisplay: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onValueChange: (next: [number, number]) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-xs text-dark/70 dark:text-white/80">
        <span className="min-w-0 truncate font-medium">{label}</span>
        <span className="min-w-0 truncate text-right text-[11px] font-medium text-dark dark:text-white">
          {valueDisplay}
        </span>
      </div>
      <div className="flex h-10 items-center rounded-xl border border-dark/10 px-3 dark:border-white/10">
        <Slider.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          min={min}
          max={max}
          step={step}
          minStepsBetweenThumbs={1}
          value={value}
          onValueChange={(values) => {
            const [a, b] = values as [number, number];
            onValueChange([a, b]);
          }}
        >
          <Slider.Track className="relative h-1 grow rounded-full bg-dark/10 dark:bg-white/20">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb
            aria-label={`${label} min`}
            className="block size-5 cursor-pointer rounded-full border-2 border-white bg-primary shadow transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Slider.Thumb
            aria-label={`${label} max`}
            className="block size-5 cursor-pointer rounded-full border-2 border-white bg-primary shadow transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </Slider.Root>
      </div>
    </div>
  );
}

export function CatalogFilterForm({
  placement,
  filters: f,
}: {
  placement: "inline" | "modal";
  filters: CatalogFilters;
}) {
  const t = useTranslations("Catalog.filters");
  const {
    isCompact,
    city,
    setCity,
    locationOptions,
    type,
    setType,
    propertyTypeOptions,
    deal,
    setDeal,
    dealTypeOptions,
    showDealFilter,
    priceDisplay,
    currentRange,
    priceValues,
    setPriceValues,
    resetFilters,
    setShowAdvanced,
    showAdvanced,
    advancedHeight,
    advancedInnerRef,
    beds,
    setBeds,
    district,
    setDistrict,
    districtOptionsFiltered,
    amenities,
    setAmenities,
    amenityMultiOptions,
    stage,
    setStage,
    sort,
    setSort,
    viewModeFromProps,
    areaDisplay,
    defaultAreaRange,
    areaValues,
    setAreaValues,
    handleSubmit,
  } = f;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        placement === "inline"
          ? cn(
              // No own glass background: the shared GLASS surface in
              // CatalogFilterCollapse backs this form (avoids the backdrop-blur
              // pop from fading a blurred layer). Only layout/padding here.
              "flex min-w-0 flex-col",
              "px-4 sm:px-6",
              isCompact ? "gap-3 py-3 sm:py-4" : "gap-4 py-4 sm:py-5"
            )
          : "mb-0 flex min-h-0 w-full min-w-0 max-w-full flex-col gap-4 rounded-none border-0 bg-transparent px-0 py-0 shadow-none"
      )}
    >
      {/*
        BASIC FILTERS — one field per grid cell so nothing ever crams.
        Fields grid (3 cols on tablet+): location · type · price / area · Search · actions.

        The secondary actions ride in the grid as a final cell rather than on a
        row of their own. With the five fields the public catalogue shows, that
        cell is the hole the fields leave at the end of the second row, so the
        panel closes there instead of carrying a third row under an empty third
        of the second one. When a deal-type filter is also on show the six
        fields fill both rows and the actions wrap below, which is the only
        honest place left for them.
        Mobile (modal) stacks everything to a single column.
      */}
      <div className="flex min-w-0 flex-col gap-4">
        <div
          className={cn(
            "grid grid-cols-1 gap-4 items-end min-w-0",
            "sm:grid-cols-2 md:grid-cols-3",
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

          {/* Deal type — only when there is more than one to choose from. */}
          {showDealFilter && (
            <FilterSelect
              label={t("dealType")}
              value={deal || "any"}
              onValueChange={setDeal}
              options={dealTypeOptions}
              anyLabel={t("any")}
            />
          )}

          {/* Price range */}
          <RangeField
            label={t("priceRange")}
            valueDisplay={priceDisplay}
            min={currentRange.min}
            max={currentRange.max}
            step={1000}
            value={priceValues}
            onValueChange={setPriceValues}
          />

          {/* Area / size range — paired inline with price, no longer a detached block */}
          <RangeField
            label={t("area")}
            valueDisplay={areaDisplay}
            min={defaultAreaRange.min}
            max={defaultAreaRange.max}
            step={1}
            value={areaValues}
            onValueChange={setAreaValues}
          />

          {/* Search: one control per cell, aligned to the field baseline */}
          <div className="flex items-end">
            <Button
              type="submit"
              className="h-10 w-full rounded-full cursor-pointer"
            >
              {t("search")}
            </Button>
          </div>

          {/* Secondary actions: slim, right-aligned, never compete with the fields */}
          <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-end sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 rounded-full cursor-pointer text-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 dark:hover:bg-primary/10 dark:hover:text-primary dark:hover:border-primary/30 w-full sm:w-auto"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <span className="inline-block max-w-full truncate">
                {t("advancedFilters")}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 rounded-full cursor-pointer text-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 dark:hover:bg-primary/10 dark:hover:text-primary dark:hover:border-primary/30 w-full sm:w-auto"
              onClick={resetFilters}
            >
              <span className="inline-block max-w-full truncate">
                {t("resetFilters")}
              </span>
            </Button>
          </div>
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
                clearLabel={t("clear")}
                doneLabel={t("done")}
              />

              {/* Construction stage. "Still being built" is the question
                  people actually ask, so it leads; the two stages behind it
                  stay available for anyone who wants the distinction. */}
              <FilterSelect
                label={t("stage")}
                value={stage || "any"}
                onValueChange={setStage}
                anyLabel={t("stageAny")}
                options={[
                  { value: "unfinished", label: t("stageUnfinished") },
                  { value: "off-plan", label: t("stageOffPlan") },
                  { value: "under-construction", label: t("stageUnderConstruction") },
                  { value: "completed", label: t("stageCompleted") },
                ]}
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
                  { value: "handoverAsc", label: t("sortHandoverAsc") },
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
      </div>
    </form>
  );
}
