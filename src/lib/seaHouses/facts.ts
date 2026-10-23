/**
 * What the sea-houses page prints, worked out from the live houses. Pure:
 * the query fetches, this decides, `messages/de.json` words it. No figure
 * without data: a median needs `MIN_STAT_LISTINGS` priced houses.
 */
import { MIN_STAT_LISTINGS } from "@/lib/catalog/listingDepth";
import { SEA_HOUSES_CARDS, SEA_HOUSES_MAX_METERS, SEA_HOUSES_MIN_ROW } from "./config";

/** What the page needs from one live house. */
export type HouseRow = {
  _id: string;
  slug: string;
  price?: number | null;
  priceUnit?: string | null;
  area?: number | null;
  citySlug?: string | null;
  cityTitle?: unknown;
  districtSlug?: string | null;
  districtTitle?: unknown;
  seaDistanceMeters?: number | null;
  beachfront?: boolean | null;
  mainImageUrl?: string | null;
};

/** The house's total asking price, or `null` when it is quoted per m² or missing. */
export function houseTotalPrice(row: HouseRow): number | null {
  if (row.priceUnit === "per-sqm") return null;
  return typeof row.price === "number" && row.price > 0 ? row.price : null;
}

/** By the sea: on the first line, or within the stated distance. */
export function isHouseBySea(row: HouseRow, maxMeters: number = SEA_HOUSES_MAX_METERS): boolean {
  if (row.beachfront === true) return true;
  return typeof row.seaDistanceMeters === "number" && row.seaDistanceMeters >= 0 && row.seaDistanceMeters <= maxMeters;
}

function median(values: readonly number[]): number | null {
  if (values.length < MIN_STAT_LISTINGS) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type SeaHouseFigures = {
  /** Houses and villas by the sea. */
  count: number;
  /** Of them, on the first line. */
  beachfront: number;
  /** Lowest total asking price among them, `null` without one. */
  from: number | null;
  /** Median total asking price, `null` under `MIN_STAT_LISTINGS` priced houses. */
  median: number | null;
  /** Every house and villa listed, by the sea or not. */
  total: number;
  /** Lowest total asking price of any house. */
  totalFrom: number | null;
};

export function seaHouseFigures(rows: readonly HouseRow[]): SeaHouseFigures {
  const sea = rows.filter((r) => isHouseBySea(r));
  const prices = sea.map(houseTotalPrice).filter((p): p is number => p !== null);
  const allPrices = rows.map(houseTotalPrice).filter((p): p is number => p !== null);
  return {
    count: sea.length,
    beachfront: sea.filter((r) => r.beachfront === true).length,
    from: prices.length ? Math.min(...prices) : null,
    median: median(prices),
    total: rows.length,
    totalFrom: allPrices.length ? Math.min(...allPrices) : null,
  };
}

/** The cards: houses by the sea, cheapest first, those without a price or a photo left out. */
export function selectSeaHouses<T extends HouseRow>(rows: readonly T[], limit: number = SEA_HOUSES_CARDS): T[] {
  return rows
    .flatMap((row) => {
      const price = houseTotalPrice(row);
      return isHouseBySea(row) && price !== null && row.mainImageUrl ? [{ row, price }] : [];
    })
    .sort((a, b) => a.price - b.price || a.row.slug.localeCompare(b.row.slug))
    .slice(0, limit)
    .map((r) => r.row);
}

export type DistrictHouseRow = {
  citySlug: string;
  cityTitle?: unknown;
  districtSlug: string | null;
  districtTitle?: unknown;
  count: number;
  beachfront: number;
  from: number | null;
  median: number | null;
  /** Median living area, m², `null` under `MIN_STAT_LISTINGS`. */
  medianArea: number | null;
};

/**
 * Houses by the sea per district, most houses first; a district with fewer
 * than `SEA_HOUSES_MIN_ROW` is folded into an "other" row of its city
 * (districtSlug `null`) so a single house is not a table row of its own.
 */
export function districtHouseRows(rows: readonly HouseRow[], minRow: number = SEA_HOUSES_MIN_ROW): DistrictHouseRow[] {
  const sea = rows.filter((r) => isHouseBySea(r) && typeof r.citySlug === "string" && r.citySlug);
  const groups = new Map<string, HouseRow[]>();
  for (const r of sea) {
    const key = `${r.citySlug}/${r.districtSlug ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const merged = new Map<string, HouseRow[]>();
  for (const [key, xs] of groups) {
    const target = xs.length >= minRow && xs[0].districtSlug ? key : `${xs[0].citySlug}/`;
    merged.set(target, [...(merged.get(target) ?? []), ...xs]);
  }
  const out: DistrictHouseRow[] = [];
  for (const [key, xs] of merged) {
    const prices = xs.map(houseTotalPrice).filter((p): p is number => p !== null);
    const areas = xs.map((x) => x.area).filter((a): a is number => typeof a === "number" && a > 0);
    // A key ending in "/" is the city's "other" row.
    const district = key.endsWith("/") ? null : (xs[0].districtSlug ?? null);
    out.push({
      citySlug: xs[0].citySlug!,
      cityTitle: xs[0].cityTitle,
      districtSlug: district,
      districtTitle: district ? xs[0].districtTitle : undefined,
      count: xs.length,
      beachfront: xs.filter((x) => x.beachfront === true).length,
      from: prices.length ? Math.min(...prices) : null,
      median: median(prices),
      medianArea: median(areas),
    });
  }
  // Named districts by size; a city's "other" row after its districts.
  return out.sort(
    (a, b) =>
      Number(a.districtSlug === null) - Number(b.districtSlug === null) ||
      b.count - a.count ||
      (a.districtSlug ?? "").localeCompare(b.districtSlug ?? ""),
  );
}
