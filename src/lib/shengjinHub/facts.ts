/**
 * What the Shëngjin hub prints, worked out from data the page already has.
 * Pure: the queries fetch, this decides, `messages/*.json` words it.
 *
 * Same rules as the listing depth blocks and the German hub: no figure
 * without data (a median over fewer than `MIN_STAT_LISTINGS` flats is left
 * out), nothing invented.
 */
import { MIN_STAT_LISTINGS } from "@/lib/catalog/listingDepth";
import { listingPricePerSqm, type SeaListingRow } from "@/lib/germanHub/facts";
import type { PriceIndexCity, PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { SHENGJIN_BUDGET_CEILINGS, SHENGJIN_SEA_LISTINGS, SHENGJIN_SEA_MAX_METERS } from "./config";

/** What the hub needs from one live flat in Shëngjin. */
export type ShengjinFlatRow = SeaListingRow & {
  _id: string;
  typeSlug?: string | null;
  bedrooms?: number | null;
  seaDistanceMeters?: number | null;
  beachfront?: boolean | null;
};

/** The flat's total asking price, or `null` when it is quoted per m² or missing. */
export function flatTotalPrice(row: ShengjinFlatRow): number | null {
  if (row.priceUnit === "per-sqm") return null;
  return typeof row.price === "number" && row.price > 0 ? row.price : null;
}

/** By the sea: on the first line, or within the stated distance. */
export function isBySea(row: ShengjinFlatRow, maxMeters: number = SHENGJIN_SEA_MAX_METERS): boolean {
  if (row.beachfront === true) return true;
  return typeof row.seaDistanceMeters === "number" && row.seaDistanceMeters >= 0 && row.seaDistanceMeters <= maxMeters;
}

/**
 * The flats by the sea to show: cheapest per m² first, listings with no
 * usable €/m² or no photo skipped.
 */
export function selectShengjinSeaListings<T extends ShengjinFlatRow>(rows: readonly T[], limit: number = SHENGJIN_SEA_LISTINGS): T[] {
  return rows
    .flatMap((row) => {
      if (!isBySea(row) || !row.mainImageUrl) return [];
      const perSqm = listingPricePerSqm(row);
      return perSqm === null ? [] : [{ row, perSqm }];
    })
    .sort((a, b) => a.perSqm - b.perSqm || a.row.slug.localeCompare(b.row.slug))
    .slice(0, limit)
    .map((r) => r.row);
}

export type BudgetBand = {
  /** Lower bound, EUR, inclusive; 0 for the first band. */
  from: number;
  /** Upper bound, EUR, exclusive; `null` for the open last band. */
  to: number | null;
  /** Flats with a total asking price in the band. */
  count: number;
  /** Of them, by the sea. */
  bySea: number;
};

/** How many flats a budget buys: one band per ceiling and an open band above the last. */
export function budgetBands(rows: readonly ShengjinFlatRow[], ceilings: readonly number[] = SHENGJIN_BUDGET_CEILINGS): BudgetBand[] {
  const bounds = [0, ...ceilings, null];
  const bands: BudgetBand[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const from = bounds[i] as number;
    const to = bounds[i + 1];
    const inBand = rows.filter((row) => {
      const price = flatTotalPrice(row);
      return price !== null && price >= from && (to === null || price < to);
    });
    bands.push({ from, to, count: inBand.length, bySea: inBand.filter((r) => isBySea(r)).length });
  }
  return bands;
}

export type LayoutRow = {
  /** `studio`, `1-1`, `2-1`, `3-1` (three or more bedrooms). */
  key: "studio" | "1-1" | "2-1" | "3-1";
  count: number;
  /** Lowest total asking price, `null` without one. */
  from: number | null;
  /** Median total asking price, `null` under `MIN_STAT_LISTINGS` priced flats. */
  median: number | null;
};

function median(values: readonly number[]): number | null {
  if (values.length < MIN_STAT_LISTINGS) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function layoutKey(row: ShengjinFlatRow): LayoutRow["key"] | null {
  if (row.typeSlug === "studio") return "studio";
  if (row.typeSlug !== "apartment") return null;
  if (row.bedrooms === 1) return "1-1";
  if (row.bedrooms === 2) return "2-1";
  if (typeof row.bedrooms === "number" && row.bedrooms >= 3) return "3-1";
  // An apartment listed without a bedroom count: a studio in the local way of listing.
  return row.bedrooms === 0 ? "studio" : null;
}

/** Studios, 1+1, 2+1 and 3+1 flats: how many, from what price, the median; rows without a flat are left out. */
export function layoutRows(rows: readonly ShengjinFlatRow[]): LayoutRow[] {
  const keys: LayoutRow["key"][] = ["studio", "1-1", "2-1", "3-1"];
  return keys.flatMap((key) => {
    const prices = rows
      .filter((r) => layoutKey(r) === key)
      .map(flatTotalPrice)
      .filter((p): p is number => p !== null);
    const count = rows.filter((r) => layoutKey(r) === key).length;
    if (count === 0) return [];
    return [{ key, count, from: prices.length ? Math.min(...prices) : null, median: median(prices) }];
  });
}

export type CompareRow = {
  slug: string;
  country: string;
  title?: unknown;
  listings: number;
  count: number;
  /** `null` below `MIN_STAT_LISTINGS` flats. */
  medianPerSqm: number | null;
  medianFlatPrice: number | null;
  flatPriceFrom: number | null;
  /** True from the index's headline floor (30 flats). */
  reliable: boolean;
};

function compareRow(city: PriceIndexCity): CompareRow {
  const enough = city.count >= MIN_STAT_LISTINGS;
  return {
    slug: city.slug,
    country: city.country,
    title: city.title,
    listings: city.listings,
    count: city.count,
    medianPerSqm: enough ? city.median : null,
    medianFlatPrice: enough ? city.medianFlatPrice : null,
    flatPriceFrom: city.flatPriceFrom,
    reliable: city.reliable,
  };
}

/** The comparison table: the named cities in their order, those without a listing left out. */
export function compareRows(snapshot: PriceIndexSnapshot, cities: readonly string[]): CompareRow[] {
  return cities.flatMap((slug) => {
    const city = snapshot.cities.find((c) => c.slug === slug && c.listings > 0);
    return city ? [compareRow(city)] : [];
  });
}

/**
 * How much cheaper Shëngjin's median €/m² is than another city's, in whole
 * per cent; `null` unless both medians exist and Shëngjin is the cheaper.
 */
export function cheaperByPercent(shengjinMedian: number | null, otherMedian: number | null): number | null {
  if (shengjinMedian === null || otherMedian === null || otherMedian <= 0 || shengjinMedian >= otherMedian) return null;
  return Math.round((1 - shengjinMedian / otherMedian) * 100);
}
