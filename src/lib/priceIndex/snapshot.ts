/**
 * Domlivo Price Index: the one calculation behind every asking-price figure
 * the site prints for a city or a district.
 *
 * Until 2026-10-19 the same Durrës median was computed by four functions over
 * four fetches (the `/info` answer box, its district table, the national hub,
 * the listing widget), and the copy around them carried two more figures typed
 * by hand. An assistant quoting the site could pick any of them. Now one
 * fetch (`fetchPriceIndexRows`) feeds this module, and the page boxes, the
 * tables, the CSV/JSON downloads, the Dataset markup and llms.txt all read the
 * snapshot it returns, with the date it was computed on.
 *
 * The sample: published, active sale listings; the price figures use flats and
 * studios only (`PRICE_INDEX_FLAT_TYPES`). Per listing the €/m² is the stated
 * rate of a per-m² listing, or the total price divided by an area of at least
 * 15 m². The figures are the median and the 20th–80th percentile band of
 * those values. Pure: no I/O, so the tests pin the arithmetic.
 */
import {
  flatPriceBand,
  groupRowsBy,
  summarizeFlatPrices,
  type ListingPriceRow,
} from "@/lib/catalog/listingPriceSummary";

/**
 * A median over fewer flats than this is not a headline figure. Pages show it
 * as "too little data: N flats", tables mark it, the downloads flag it
 * (`lowSample`). Thirty is the usual floor for a stable median of a skewed
 * price distribution; Tirana's 11 flats were being quoted as "the Tirana price".
 */
export const MIN_HEADLINE_SAMPLE = 30;

/** Construction stages counted as new builds in the new/completed split. */
export const NEW_BUILD_STAGES: readonly string[] = ["off-plan", "under-construction"];

/** One live sale listing, as the index fetch returns it. */
export type PriceIndexListingRow = ListingPriceRow & {
  stage?: string | null;
  /** City slug. */
  c?: string | null;
  /** District slug. */
  d?: string | null;
};

export type PriceIndexPlace = {
  slug: string;
  /** Localized title object from the CMS. */
  title?: unknown;
};

export type PriceIndexCityPlace = PriceIndexPlace & {
  /** Country slug, the first segment of the city's URLs. */
  country?: string | null;
};

/** The figures of one group of listings. */
export type PriceIndexFigures = {
  /** Sale listings of every type: land and commercial included. */
  listings: number;
  /** Flats and studios among them. */
  flats: number;
  /** Flats with a usable €/m²: the sample the median and the band are taken over. */
  count: number;
  /** Median asking price per m², EUR. */
  median: number | null;
  /** 20th percentile of the asking price per m², EUR. */
  p20: number | null;
  /** 80th percentile of the asking price per m², EUR. */
  p80: number | null;
  /** Median total asking price of a flat, EUR. */
  medianFlatPrice: number | null;
  /** Lowest total asking price of a flat, EUR. */
  flatPriceFrom: number | null;
  /** False below `MIN_HEADLINE_SAMPLE`: show it, but never as the headline. */
  reliable: boolean;
};

export type PriceIndexDistrict = PriceIndexFigures & { slug: string; title?: unknown };

export type PriceIndexCity = PriceIndexFigures & {
  slug: string;
  title?: unknown;
  country: string;
  /** Off-plan or under construction. */
  newBuild: PriceIndexFigures;
  /** Everything else: completed stock, resale and handed-over new builds. */
  completed: PriceIndexFigures;
  /** Published districts with at least one listing, most flats first. */
  districts: PriceIndexDistrict[];
};

export type PriceIndexSnapshot = {
  /** Day the figures were computed, YYYY-MM-DD (UTC). */
  asOf: string;
  /** Moment the listings were read, ISO 8601. */
  computedAt: string;
  national: PriceIndexFigures;
  /** Published cities with at least one listing, most listings first. */
  cities: PriceIndexCity[];
};

export function isReliableSample(count: number): boolean {
  return count >= MIN_HEADLINE_SAMPLE;
}

/** The index figures of one group of listings. */
export function computePriceIndexFigures(rows: readonly ListingPriceRow[]): PriceIndexFigures {
  const summary = summarizeFlatPrices(rows);
  const band = flatPriceBand(rows);
  return {
    listings: summary.count,
    flats: summary.flatCount,
    count: band.pricedCount,
    median: band.median,
    p20: band.p20,
    p80: band.p80,
    medianFlatPrice: summary.medianFlatPrice,
    flatPriceFrom: summary.flatPriceFrom,
    reliable: isReliableSample(band.pricedCount),
  };
}

export function isNewBuildRow(row: { stage?: string | null }): boolean {
  return typeof row.stage === "string" && NEW_BUILD_STAGES.includes(row.stage);
}

/**
 * The whole snapshot from one read of the listings. Rows of an unpublished
 * city or district still count towards the national figures and their city
 * (the listing itself is live), but get no row of their own.
 */
export function buildPriceIndexSnapshot(input: {
  rows: readonly PriceIndexListingRow[];
  cities: readonly PriceIndexCityPlace[];
  districts: readonly PriceIndexPlace[];
  computedAt: string;
}): PriceIndexSnapshot {
  const cityBySlug = new Map(input.cities.map((c) => [c.slug, c]));
  const districtBySlug = new Map(input.districts.map((d) => [d.slug, d]));

  const cities = [...groupRowsBy(input.rows, (r) => (r.c && cityBySlug.has(r.c) ? r.c : null)).entries()]
    .map(([slug, rows]): PriceIndexCity => {
      const districts = [...groupRowsBy(rows, (r) => (r.d && districtBySlug.has(r.d) ? r.d : null)).entries()]
        .map(([districtSlug, items]) => ({
          slug: districtSlug,
          title: districtBySlug.get(districtSlug)?.title,
          ...computePriceIndexFigures(items),
        }))
        .sort((a, b) => b.flats - a.flats || b.listings - a.listings || a.slug.localeCompare(b.slug));
      return {
        slug,
        title: cityBySlug.get(slug)?.title,
        country: cityBySlug.get(slug)?.country || "albania",
        ...computePriceIndexFigures(rows),
        newBuild: computePriceIndexFigures(rows.filter(isNewBuildRow)),
        completed: computePriceIndexFigures(rows.filter((r) => !isNewBuildRow(r))),
        districts,
      };
    })
    .sort((a, b) => b.listings - a.listings || a.slug.localeCompare(b.slug));

  return {
    asOf: input.computedAt.slice(0, 10),
    computedAt: input.computedAt,
    national: computePriceIndexFigures(input.rows),
    cities,
  };
}

export function findIndexCity(snapshot: PriceIndexSnapshot | null, citySlug: string): PriceIndexCity | null {
  return snapshot?.cities.find((c) => c.slug === citySlug) ?? null;
}
