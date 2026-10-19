/**
 * Budget chips for a district page ("Find one in this district"): four fixed
 * bands, each shown only when the district has a listing in it right now, so
 * a chip never opens an empty catalogue. Counting follows the catalogue's own
 * price filter (src/lib/sanity/queries/catalog.ts): both ends inclusive,
 * totals only — a per-m² rate is not a price the filter compares.
 */

export type BudgetBandKey = "under70" | "70to120" | "120to200" | "over200";

export type BudgetBand = {
  key: BudgetBandKey;
  /** `minPrice` of the catalogue link; absent for the lowest band. */
  min?: number;
  /** `maxPrice` of the catalogue link; absent for the highest band. */
  max?: number;
};

export const BUDGET_BANDS: readonly BudgetBand[] = [
  { key: "under70", max: 70_000 },
  { key: "70to120", min: 70_000, max: 120_000 },
  { key: "120to200", min: 120_000, max: 200_000 },
  { key: "over200", min: 200_000 },
];

export type BudgetBandCount = BudgetBand & { count: number };

/** Whether the catalogue's price filter would list a total of `price` under `band`. */
export function inBudgetBand(price: number, band: BudgetBand): boolean {
  if (!(price > 0)) return false;
  if (typeof band.min === "number" && price < band.min) return false;
  if (typeof band.max === "number" && price > band.max) return false;
  return true;
}

/** The bands with at least one listing, in order, with their counts. */
export function liveBudgetBands(rows: ReadonlyArray<{ price?: number | null; priceUnit?: string | null }>): BudgetBandCount[] {
  const totals = rows
    .filter((r) => r.priceUnit !== "per-sqm" && typeof r.price === "number" && r.price > 0)
    .map((r) => r.price as number);
  return BUDGET_BANDS.map((band) => ({ ...band, count: totals.filter((p) => inBudgetBand(p, band)).length })).filter(
    (b) => b.count > 0,
  );
}

/** Catalogue query of a band: `minPrice` / `maxPrice`, as the filter form writes them. */
export function budgetBandQuery(band: BudgetBand): URLSearchParams {
  const q = new URLSearchParams();
  if (typeof band.min === "number") q.set("minPrice", String(band.min));
  if (typeof band.max === "number") q.set("maxPrice", String(band.max));
  return q;
}
