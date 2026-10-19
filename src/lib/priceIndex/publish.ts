/**
 * How the Domlivo Price Index leaves the site: its name, licence, URLs, the
 * citation line, and the JSON and CSV files under `/data/prices/`. Pure, so
 * the download routes, the Dataset markup and llms.txt cannot describe the
 * same figures in different words.
 */
import { resolveLocalizedString } from "@/lib/sanity/localized";
import {
  MIN_HEADLINE_SAMPLE,
  type PriceIndexCity,
  type PriceIndexFigures,
  type PriceIndexSnapshot,
} from "@/lib/priceIndex/snapshot";

export const PRICE_INDEX_NAME = "Domlivo Price Index";
export const PRICE_INDEX_LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
export const PRICE_INDEX_LICENSE_NAME = "CC BY 4.0";
/** The data is recomputed from the live listings at most this often. */
export const PRICE_INDEX_REVALIDATE_SECONDS = 3600;

/** Outside `/api/`: robots.txt keeps crawlers out of that prefix. */
export const PRICE_INDEX_JSON_PATH = "/data/prices/index.json";

export function cityCsvPath(citySlug: string): string {
  return `/data/prices/${citySlug}.csv`;
}

export function methodologyPath(locale: string): string {
  return `/${locale}/methodology`;
}

export function cityInfoPath(city: Pick<PriceIndexCity, "slug" | "country">, locale: string): string {
  return `/${locale}/${city.country}/${city.slug}/info`;
}

function trimBase(base: string): string {
  return base.replace(/\/$/, "");
}

/** English name of a place, falling back to its slug. */
export function placeName(title: unknown, slug: string): string {
  return resolveLocalizedString(title as never, "en") || slug;
}

/** "Domlivo Price Index, Durrës, 2026-10-19, https://…" — the line the methodology asks people to cite. */
export function citationLine(placeLabel: string, date: string, url: string): string {
  return `${PRICE_INDEX_NAME}, ${placeLabel}, ${date}, ${url}`;
}

type JsonFigures = {
  medianEurPerSqm: number | null;
  p20EurPerSqm: number | null;
  p80EurPerSqm: number | null;
  count: number;
  flats: number;
  listings: number;
  medianFlatPriceEur: number | null;
  flatPriceFromEur: number | null;
  lowSample: boolean;
  /** Change of the median against the previous month, %. No history is kept yet, so always null. */
  monthOverMonthPct: null;
};

function jsonFigures(f: PriceIndexFigures): JsonFigures {
  return {
    medianEurPerSqm: f.median,
    p20EurPerSqm: f.p20,
    p80EurPerSqm: f.p80,
    count: f.count,
    flats: f.flats,
    listings: f.listings,
    medianFlatPriceEur: f.medianFlatPrice,
    flatPriceFromEur: f.flatPriceFrom,
    lowSample: !f.reliable,
    monthOverMonthPct: null,
  };
}

/** `/data/prices/index.json`: every city and district in one document. */
export function buildPriceIndexJson(snapshot: PriceIndexSnapshot, baseUrl: string) {
  const base = trimBase(baseUrl);
  return {
    name: PRICE_INDEX_NAME,
    description:
      "Median and 20th–80th percentile asking price per square metre of flats and studios listed for sale on domlivo.com, " +
      "by city and district in Albania, recomputed hourly from the live listings. Asking prices, not completed sales.",
    date: snapshot.asOf,
    computedAt: snapshot.computedAt,
    currency: "EUR",
    unit: "EUR per square metre",
    minHeadlineSample: MIN_HEADLINE_SAMPLE,
    license: PRICE_INDEX_LICENSE_URL,
    licenseName: PRICE_INDEX_LICENSE_NAME,
    methodology: `${base}${methodologyPath("en")}`,
    citation: citationLine("<city>", "<date>", "<URL>"),
    fields: {
      medianEurPerSqm: "Median asking price per m² of the flats in `count`",
      p20EurPerSqm: "20th percentile of the asking price per m²",
      p80EurPerSqm: "80th percentile of the asking price per m²",
      count: "Flats and studios with a usable price per m²: the sample",
      flats: "Flats and studios listed for sale",
      listings: "Sale listings of every type, land and commercial included",
      medianFlatPriceEur: "Median total asking price of a flat",
      flatPriceFromEur: "Lowest total asking price of a flat",
      lowSample: `True when count is under ${MIN_HEADLINE_SAMPLE}: indicative, not a headline figure`,
      monthOverMonthPct: "Change of the median against the previous month; null until a month of history exists",
    },
    national: jsonFigures(snapshot.national),
    cities: snapshot.cities.map((city) => ({
      slug: city.slug,
      name: placeName(city.title, city.slug),
      url: `${base}${cityInfoPath(city, "en")}`,
      csv: `${base}${cityCsvPath(city.slug)}`,
      ...jsonFigures(city),
      districts: city.districts.map((d) => ({
        slug: d.slug,
        name: placeName(d.title, d.slug),
        ...jsonFigures(d),
      })),
    })),
  };
}

export const CITY_CSV_COLUMNS = [
  "city",
  "district",
  "district_slug",
  "date",
  "median_eur_per_sqm",
  "p20_eur_per_sqm",
  "p80_eur_per_sqm",
  "count",
  "flats",
  "listings",
  "median_flat_price_eur",
  "flat_price_from_eur",
  "low_sample",
] as const;

function csvCell(value: string | number | boolean | null): string {
  if (value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * `/data/prices/{city}.csv`: the whole city first (empty district), then each
 * district. RFC 4180: comma-separated, CRLF line ends, quoted where needed.
 */
export function buildCityCsv(city: PriceIndexCity, asOf: string): string {
  const cityName = placeName(city.title, city.slug);
  const row = (district: string, districtSlug: string, f: PriceIndexFigures) =>
    [
      cityName,
      district,
      districtSlug,
      asOf,
      f.median,
      f.p20,
      f.p80,
      f.count,
      f.flats,
      f.listings,
      f.medianFlatPrice,
      f.flatPriceFrom,
      !f.reliable,
    ]
      .map(csvCell)
      .join(",");
  const lines = [
    CITY_CSV_COLUMNS.join(","),
    row("", "", city),
    ...city.districts.map((d) => row(placeName(d.title, d.slug), d.slug, d)),
  ];
  return `${lines.join("\r\n")}\r\n`;
}
