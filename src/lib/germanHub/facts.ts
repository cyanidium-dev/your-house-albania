/**
 * What the German hub prints, worked out from data the page already has.
 * Pure: the queries fetch, this decides, `messages/de.json` words it.
 *
 * Same rules as the listing depth blocks: no figure without data (a median
 * over fewer than `MIN_STAT_LISTINGS` flats is left out), nothing invented.
 */
import { MIN_PLAUSIBLE_AREA_SQM } from "@/lib/catalog/listingPriceSummary";
import { MIN_STAT_LISTINGS } from "@/lib/catalog/listingDepth";
import type { PriceIndexCity, PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { GERMAN_HUB_SEA_LISTINGS, GERMAN_HUB_SEA_PER_CITY } from "./config";

/** What the sea selection needs from one listing. */
export type SeaListingRow = {
  slug: string;
  price?: number | null;
  priceUnit?: string | null;
  area?: number | null;
  citySlug?: string | null;
  mainImageUrl?: string | null;
};

/** Asking price per m² of one listing: the stated rate, or the total over a plausible area. */
export function listingPricePerSqm(row: SeaListingRow): number | null {
  const price = typeof row.price === "number" && row.price > 0 ? row.price : null;
  if (price === null) return null;
  if (row.priceUnit === "per-sqm") return price;
  const area = typeof row.area === "number" && row.area >= MIN_PLAUSIBLE_AREA_SQM ? row.area : null;
  return area === null ? null : price / area;
}

/**
 * The flats by the sea to show: the cheapest per m² relative to their city
 * median first, at most `perCity` from one city while other cities still have
 * candidates, so Durrës (most of the stock) does not fill the whole grid.
 * Listings with no usable €/m² or no photo are skipped; a city without a
 * median sorts after the ones with one, by plain €/m².
 */
export function selectSeaListings<T extends SeaListingRow>(
  rows: readonly T[],
  cityMedianPerSqm: ReadonlyMap<string, number>,
  limit: number = GERMAN_HUB_SEA_LISTINGS,
  perCity: number = GERMAN_HUB_SEA_PER_CITY,
): T[] {
  const ranked = rows
    .flatMap((row) => {
      const perSqm = listingPricePerSqm(row);
      if (perSqm === null || !row.mainImageUrl) return [];
      const median = row.citySlug ? cityMedianPerSqm.get(row.citySlug) : undefined;
      const ratio = typeof median === "number" && median > 0 ? perSqm / median : null;
      return [{ row, perSqm, ratio }];
    })
    .sort((a, b) => {
      if (a.ratio !== null && b.ratio !== null) return a.ratio - b.ratio || a.perSqm - b.perSqm;
      if (a.ratio !== null) return -1;
      if (b.ratio !== null) return 1;
      return a.perSqm - b.perSqm;
    });

  const picked: T[] = [];
  const taken = new Set<string>();
  const perCityCount = new Map<string, number>();
  for (const { row } of ranked) {
    if (picked.length >= limit) break;
    const city = row.citySlug ?? "";
    const n = perCityCount.get(city) ?? 0;
    if (n >= perCity) continue;
    perCityCount.set(city, n + 1);
    picked.push(row);
    taken.add(row.slug);
  }
  for (const { row } of ranked) {
    if (picked.length >= limit) break;
    if (taken.has(row.slug)) continue;
    picked.push(row);
    taken.add(row.slug);
  }
  return picked;
}

export type HubCityRow = {
  slug: string;
  country: string;
  title?: unknown;
  /** Sale listings of every type. */
  listings: number;
  /** Flats with a usable €/m²: the sample behind the median. */
  count: number;
  /** `null` below `MIN_STAT_LISTINGS` flats. */
  medianPerSqm: number | null;
  p20: number | null;
  p80: number | null;
  flatPriceFrom: number | null;
  /** True from the index's headline floor (30 flats). */
  reliable: boolean;
};

function cityRow(city: PriceIndexCity): HubCityRow {
  const enough = city.count >= MIN_STAT_LISTINGS;
  return {
    slug: city.slug,
    country: city.country,
    title: city.title,
    listings: city.listings,
    count: city.count,
    medianPerSqm: enough ? city.median : null,
    p20: enough ? city.p20 : null,
    p80: enough ? city.p80 : null,
    flatPriceFrom: city.flatPriceFrom,
    reliable: city.reliable,
  };
}

/**
 * The price table: the lead cities first in their order, then every other
 * city with a listing, most listings first.
 */
export function hubCityRows(snapshot: PriceIndexSnapshot, leadCities: readonly string[]): HubCityRow[] {
  const bySlug = new Map(snapshot.cities.filter((c) => c.listings > 0).map((c) => [c.slug, c]));
  const lead = leadCities.flatMap((slug) => {
    const city = bySlug.get(slug);
    return city ? [cityRow(city)] : [];
  });
  const rest = [...bySlug.values()]
    .filter((c) => !leadCities.includes(c.slug))
    .sort((a, b) => b.listings - a.listings || a.slug.localeCompare(b.slug))
    .map(cityRow);
  return [...lead, ...rest];
}

/** The lead cities that have a median to print, in lead order. */
export function hubLeadCities(rows: readonly HubCityRow[], leadCities: readonly string[]): HubCityRow[] {
  return leadCities.flatMap((slug) => {
    const row = rows.find((r) => r.slug === slug);
    return row && row.medianPerSqm !== null ? [row] : [];
  });
}

/** City slug → median €/m², for the sea selection's ratio. */
export function cityMedianMap(rows: readonly HubCityRow[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows) if (row.medianPerSqm !== null) out.set(row.slug, row.medianPerSqm);
  return out;
}
