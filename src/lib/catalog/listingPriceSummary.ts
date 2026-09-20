/**
 * The arithmetic behind every price figure a listing page prints — the city
 * and district price index, the national hub's table, the facts line. One
 * place, so a median on `/sale` and the same median on `/albania/durres` can
 * never be computed two ways. Pure: the queries fetch rows, this summarises.
 */

/** What a price figure needs from a listing. */
export type ListingPriceRow = {
  price?: number | null;
  /** `per-sqm` when `price` is a rate per m², anything else a total. */
  priceUnit?: string | null;
  area?: number | null;
  /** Property type slug. */
  type?: string | null;
};

/** Types whose prices are comparable enough to share a median. */
export const PRICE_INDEX_FLAT_TYPES: readonly string[] = ["apartment", "studio"];

/** An area under this is a data error, not a home; it is left out of per-m² figures. */
export const MIN_PLAUSIBLE_AREA_SQM = 15;

/** Median, rounded to a whole number when it falls between two values. `null` for an empty list. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

const hasPrice = (r: ListingPriceRow): r is ListingPriceRow & { price: number } => typeof r.price === "number" && r.price > 0;

/** Total asking prices. A per-m² rate is not a total and is left out. */
export function totalPrices(rows: readonly ListingPriceRow[]): number[] {
  return rows.filter((r) => hasPrice(r) && r.priceUnit !== "per-sqm").map((r) => r.price as number);
}

/** EUR/m² per listing: the stated rate, or total ÷ area when the area is plausible. */
export function pricesPerSqm(rows: readonly ListingPriceRow[]): number[] {
  return rows.flatMap((r) => {
    if (!hasPrice(r)) return [];
    if (r.priceUnit === "per-sqm") return [r.price];
    return typeof r.area === "number" && r.area >= MIN_PLAUSIBLE_AREA_SQM ? [Math.round(r.price / r.area)] : [];
  });
}

export type FlatPriceSummary = {
  /** Every listing in the group, land and commercial included. */
  count: number;
  /**
   * The price figures are flats only. A district like Spille is mostly land
   * and commercial space, and one median across a plot and a studio is noise.
   */
  flatCount: number;
  flatPriceFrom: number | null;
  medianFlatPrice: number | null;
  medianFlatPricePerSqm: number | null;
};

export function isFlatRow(row: ListingPriceRow): boolean {
  return typeof row.type === "string" && PRICE_INDEX_FLAT_TYPES.includes(row.type);
}

/** Count of a group of listings and the asking-price figures of its flats. */
export function summarizeFlatPrices(rows: readonly ListingPriceRow[]): FlatPriceSummary {
  const flats = rows.filter(isFlatRow);
  const totals = totalPrices(flats);
  return {
    count: rows.length,
    flatCount: flats.length,
    flatPriceFrom: totals.length ? Math.min(...totals) : null,
    medianFlatPrice: median(totals),
    medianFlatPricePerSqm: median(pricesPerSqm(flats)),
  };
}

/** Rows grouped by a key, in first-seen order; rows without a key are skipped. */
export function groupRowsBy<T>(rows: readonly T[], keyOf: (row: T) => string | null | undefined): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) continue;
    const group = out.get(key);
    if (group) group.push(row);
    else out.set(key, [row]);
  }
  return out;
}
