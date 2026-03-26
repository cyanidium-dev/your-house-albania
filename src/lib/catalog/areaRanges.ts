/**
 * Area range utilities for catalog filters.
 * CMS-driven range from siteSettings.areaRange { from, to }, with fallback to
 * aggregated property data, then safe defaults.
 */

import {
  interpretPriceRangeState,
  type PriceRangeState,
} from "@/lib/catalog/priceRanges";

export type CmsAreaRange = { from: number; to: number };

/** Used when CMS and live data are missing or invalid. */
export const DEFAULT_AREA_RANGE: CmsAreaRange = {
  from: 30,
  to: 500,
};

export function normalizeAreaRange(input: unknown): CmsAreaRange | null {
  if (!input) return null;

  const { from, to } = (input as Record<string, unknown>) ?? {};

  if (typeof from !== "number") return null;
  if (typeof to !== "number") return null;
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  if (from < 0) return null;
  if (to < from) return null;

  return { from, to };
}

/**
 * Ensures min < max for Radix slider; pads when all properties share one area value.
 */
export function ensureSliderAreaBounds(
  min: number,
  max: number
): { min: number; max: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: DEFAULT_AREA_RANGE.from, max: DEFAULT_AREA_RANGE.to };
  }
  if (min <= 0 && max <= 0) {
    return { min: DEFAULT_AREA_RANGE.from, max: DEFAULT_AREA_RANGE.to };
  }
  if (max < min) {
    return { min: DEFAULT_AREA_RANGE.from, max: DEFAULT_AREA_RANGE.to };
  }
  if (min === max) {
    const pad = Math.max(1, Math.round(Math.abs(min) * 0.05) || 1);
    return { min: Math.max(0, min - pad), max: max + pad };
  }
  return { min, max };
}

/**
 * Resolves slider bounds: CMS first, then optional data-derived bounds, then defaults.
 */
export function resolveAreaRangeBounds(
  cmsAreaRange: unknown,
  dataBounds: { min: number; max: number } | null
): { min: number; max: number } {
  const fromCms = normalizeAreaRange(cmsAreaRange);
  if (fromCms) {
    return ensureSliderAreaBounds(fromCms.from, fromCms.to);
  }

  if (dataBounds) {
    return ensureSliderAreaBounds(dataBounds.min, dataBounds.max);
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[areaRanges] No CMS areaRange and no data bounds; using DEFAULT_AREA_RANGE"
    );
  }

  return { min: DEFAULT_AREA_RANGE.from, max: DEFAULT_AREA_RANGE.to };
}

export function interpretAreaRangeState(
  current: { min: number; max: number },
  defaultRange: { min: number; max: number }
): PriceRangeState {
  return interpretPriceRangeState(current, defaultRange);
}

export function getAreaQueryParams(state: PriceRangeState): {
  minArea?: string;
  maxArea?: string;
} {
  switch (state.kind) {
    case "unset":
      return {};
    case "fromOnly":
      return { minArea: String(Math.round(state.from)) };
    case "toOnly":
      return { maxArea: String(Math.round(state.to)) };
    case "both":
      return {
        minArea: String(Math.round(state.from)),
        maxArea: String(Math.round(state.to)),
      };
  }
}

/** Keys supplied from `Catalog.filters` (area-specific; not price). */
export type AreaFilterDisplayKey = "any" | "areaFrom" | "areaTo";

/**
 * Compact area summary for the catalog slider (m²).
 * - Full range: localized "Any"
 * - Min or max only: `areaFrom` / `areaTo` + value + unit (e.g. "Min 50 m²")
 * - Both: `50–120 m²` (en dash, single unit suffix)
 */
export function formatAreaRangeDisplay(
  state: PriceRangeState,
  options: {
    t: (key: AreaFilterDisplayKey) => string;
    unit: string;
  }
): string {
  const { t, unit } = options;
  const u = unit.trim();
  const fmt = (n: number) => String(Math.round(n));
  const enDash = "\u2013";
  switch (state.kind) {
    case "unset":
      return t("any");
    case "fromOnly":
      return `${t("areaFrom")} ${fmt(state.from)} ${u}`.replace(/\s+/g, " ").trim();
    case "toOnly":
      return `${t("areaTo")} ${fmt(state.to)} ${u}`.replace(/\s+/g, " ").trim();
    case "both":
      return `${fmt(state.from)}${enDash}${fmt(state.to)} ${u}`;
  }
}
