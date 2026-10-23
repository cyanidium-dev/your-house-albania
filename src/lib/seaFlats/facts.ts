/**
 * What the seaside flats landings print, from the live flats by the sea.
 * Pure: the query fetches, this decides, `messages/*.json` words it. No
 * figure without data: a median needs `MIN_STAT_LISTINGS` priced flats.
 */
import { MIN_STAT_LISTINGS } from "@/lib/catalog/listingDepth";
import { listingPricePerSqm, type SeaListingRow } from "@/lib/germanHub/facts";

/** One live flat by the sea, as the light query returns it. */
export type SeaFlatRow = SeaListingRow & {
  _id: string;
  cityTitle?: unknown;
  country?: string | null;
  beachfront?: boolean | null;
};

function median(values: readonly number[]): number | null {
  if (values.length < MIN_STAT_LISTINGS) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function totalPrice(row: SeaFlatRow): number | null {
  if (row.priceUnit === "per-sqm") return null;
  return typeof row.price === "number" && row.price > 0 ? row.price : null;
}

export type SeaFlatFigures = {
  /** Flats and studios by the sea. */
  count: number;
  /** Of them, on the first line. */
  beachfront: number;
  /** Lowest total asking price among them. */
  from: number | null;
  /** Median asking price per m² of the flats by the sea, `null` under `MIN_STAT_LISTINGS`. */
  medianPerSqm: number | null;
  /** Median total asking price. */
  medianPrice: number | null;
};

export function seaFlatFigures(rows: readonly SeaFlatRow[]): SeaFlatFigures {
  const prices = rows.map(totalPrice).filter((p): p is number => p !== null);
  const perSqm = rows.map(listingPricePerSqm).filter((p): p is number => p !== null);
  return {
    count: rows.length,
    beachfront: rows.filter((r) => r.beachfront === true).length,
    from: prices.length ? Math.min(...prices) : null,
    medianPerSqm: median(perSqm),
    medianPrice: median(prices),
  };
}

export type SeaFlatCityRow = SeaFlatFigures & {
  citySlug: string;
  cityTitle?: unknown;
  country: string;
};

/** Flats by the sea per city, most flats first; cities without a country slug are left out. */
export function seaFlatCityRows(rows: readonly SeaFlatRow[]): SeaFlatCityRow[] {
  const groups = new Map<string, SeaFlatRow[]>();
  for (const r of rows) {
    if (!r.citySlug || !r.country) continue;
    groups.set(r.citySlug, [...(groups.get(r.citySlug) ?? []), r]);
  }
  return [...groups.entries()]
    .map(([citySlug, xs]) => ({ citySlug, cityTitle: xs[0].cityTitle, country: xs[0].country!, ...seaFlatFigures(xs) }))
    .sort((a, b) => b.count - a.count || a.citySlug.localeCompare(b.citySlug));
}

/** The city with the lowest median €/m² by the sea among those with a median; `null` when none has one. */
export function cheapestSeaCity(rows: readonly SeaFlatCityRow[]): SeaFlatCityRow | null {
  const withMedian = rows.filter((r) => r.medianPerSqm !== null);
  if (withMedian.length === 0) return null;
  return withMedian.reduce((best, r) => (r.medianPerSqm! < best.medianPerSqm! ? r : best));
}
