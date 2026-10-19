/**
 * schema.org markup for the Domlivo Price Index: a `Dataset` per city on its
 * `/info` page, the `DataCatalog` of all of them on the methodology page, and
 * a `Dataset` per monthly edition in the blog.
 *
 * Everything an assistant or Google Dataset Search needs to cite a figure is
 * in the node itself: the headline value with its date and sample in the
 * description, the licence, the CSV and JSON downloads, and an inline
 * Organization (some consumers do not resolve an `@id` into another script
 * block). English throughout, like the downloads it describes.
 */
import {
  MIN_HEADLINE_SAMPLE,
  type PriceIndexCity,
  type PriceIndexSnapshot,
} from "@/lib/priceIndex/snapshot";
import {
  cityCsvPath,
  cityInfoPath,
  methodologyPath,
  placeName,
  PRICE_INDEX_JSON_PATH,
  PRICE_INDEX_LICENSE_URL,
  PRICE_INDEX_NAME,
} from "@/lib/priceIndex/publish";

const BRAND = "Domlivo";

function trimBase(base: string): string {
  return base.replace(/\/$/, "");
}

function organization(base: string) {
  return { "@type": "Organization", "@id": `${base}/#organization`, name: BRAND, url: `${base}/` };
}

const eur = (n: number) => `€${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(n)}`;

/** "19 October 2026". */
export function englishDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${isoDate.slice(0, 10)}T00:00:00Z`),
  );
}

const MEASUREMENT_TECHNIQUE =
  "Median and 20th–80th percentile of the asking price per square metre over the flats and studios listed for sale " +
  "on domlivo.com at the time of computation: published, active sale listings; the stated rate for a listing priced " +
  "per m², otherwise the total asking price divided by the floor area (areas under 15 m² excluded). " +
  `A median over fewer than ${MIN_HEADLINE_SAMPLE} flats is flagged as a low sample.`;

/** Stable across locales, so the seven `/info` pages describe one dataset. */
export function cityDatasetId(base: string, city: Pick<PriceIndexCity, "slug" | "country">): string {
  return `${trimBase(base)}${cityInfoPath(city, "en")}#price-index`;
}

export function priceIndexCatalogId(base: string): string {
  return `${trimBase(base)}${methodologyPath("en")}#data-catalog`;
}

/** The headline sentence: value, sample, date, band — or why there is no headline. */
export function cityHeadline(city: PriceIndexCity, asOf: string): string {
  const name = placeName(city.title, city.slug);
  const date = englishDate(asOf);
  if (city.median === null) return `No flats with a usable asking price per m² in ${name} on ${date}.`;
  if (!city.reliable) {
    return (
      `Too little data for a headline figure in ${name}: ${city.count} ${city.count === 1 ? "flat" : "flats"} with a price per m² on ${date} ` +
      `(indicative median ${eur(city.median)} per m²; the index needs ${MIN_HEADLINE_SAMPLE}).`
    );
  }
  const band = city.p20 !== null && city.p80 !== null ? ` (20th–80th percentile ${eur(city.p20)}–${eur(city.p80)})` : "";
  return (
    `Median asking price of a flat in ${name}, Albania: ${eur(city.median)} per m² on ${date}, ` +
    `from ${city.count} flats and studios listed for sale on Domlivo${band}.`
  );
}

function cityDescription(city: PriceIndexCity, asOf: string): string {
  return (
    `${cityHeadline(city, asOf)} ${PRICE_INDEX_NAME}: median asking price per m², 20th–80th percentile band, ` +
    `sample size, median and lowest flat price for the whole city and each district, computed from ${city.listings} ` +
    `sale listings (${city.flats} flats and studios). Asking prices, not completed sales; recomputed hourly.`
  );
}

function distribution(base: string, city: Pick<PriceIndexCity, "slug">) {
  return [
    {
      "@type": "DataDownload",
      encodingFormat: "text/csv",
      contentUrl: `${base}${cityCsvPath(city.slug)}`,
      name: "District table (CSV)",
    },
    {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${base}${PRICE_INDEX_JSON_PATH}`,
      name: "All cities and districts (JSON)",
    },
  ];
}

function keywords(cityName: string): string[] {
  return [
    `${cityName} property prices`,
    `${cityName} apartment price per square metre`,
    "Albania real estate prices",
    "asking prices",
    "price per m²",
    PRICE_INDEX_NAME,
  ];
}

function variableMeasured(city: PriceIndexCity) {
  const value = (v: number | null) => (v === null ? {} : { value: v });
  return [
    { "@type": "PropertyValue", name: "Median asking price per square metre", unitText: "EUR/m²", ...value(city.median) },
    { "@type": "PropertyValue", name: "20th percentile asking price per square metre", unitText: "EUR/m²", ...value(city.p20) },
    { "@type": "PropertyValue", name: "80th percentile asking price per square metre", unitText: "EUR/m²", ...value(city.p80) },
    { "@type": "PropertyValue", name: "Flats in the sample", unitText: "listings", value: city.count },
    { "@type": "PropertyValue", name: "Median asking price of a flat", unitText: "EUR", ...value(city.medianFlatPrice) },
  ];
}

function catalogRef(base: string) {
  return { "@type": "DataCatalog", "@id": priceIndexCatalogId(base), name: PRICE_INDEX_NAME, url: `${base}${methodologyPath("en")}` };
}

/** The Dataset on `/{locale}/{country}/{city}/info`. */
export function buildCityDatasetJsonLd(input: {
  baseUrl: string;
  locale: string;
  snapshot: PriceIndexSnapshot;
  city: PriceIndexCity;
}): object {
  const base = trimBase(input.baseUrl);
  const { city, snapshot } = input;
  const name = placeName(city.title, city.slug);
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": cityDatasetId(base, city),
    name: `${PRICE_INDEX_NAME}: asking prices of flats in ${name}, Albania`,
    description: cityDescription(city, snapshot.asOf),
    url: `${base}${cityInfoPath(city, input.locale)}`,
    inLanguage: "en",
    isAccessibleForFree: true,
    license: PRICE_INDEX_LICENSE_URL,
    keywords: keywords(name),
    dateModified: snapshot.computedAt,
    temporalCoverage: snapshot.asOf,
    creator: organization(base),
    publisher: organization(base),
    spatialCoverage: {
      "@type": "Place",
      name: `${name}, Albania`,
      ...(city.districts.length > 0
        ? { containsPlace: city.districts.map((d) => ({ "@type": "Place", name: placeName(d.title, d.slug) })) }
        : {}),
    },
    variableMeasured: variableMeasured(city),
    measurementTechnique: MEASUREMENT_TECHNIQUE,
    distribution: distribution(base, city),
    includedInDataCatalog: catalogRef(base),
    isBasedOn: `${base}${methodologyPath("en")}`,
  };
}

/** The DataCatalog on the methodology page: every city dataset as a part. */
export function buildPriceIndexCatalogJsonLd(input: {
  baseUrl: string;
  locale: string;
  snapshot: PriceIndexSnapshot;
}): object {
  const base = trimBase(input.baseUrl);
  const { snapshot } = input;
  return {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    "@id": priceIndexCatalogId(base),
    name: PRICE_INDEX_NAME,
    description:
      "Asking prices of flats and studios listed for sale on domlivo.com, by city and district in Albania: median and " +
      "20th–80th percentile price per m², sample size, recomputed hourly from the live listings. CSV per city and one JSON " +
      "file for all of them, under CC BY 4.0.",
    url: `${base}${methodologyPath(input.locale)}`,
    inLanguage: "en",
    license: PRICE_INDEX_LICENSE_URL,
    dateModified: snapshot.computedAt,
    creator: organization(base),
    publisher: organization(base),
    hasPart: snapshot.cities.map((city) => {
      const name = placeName(city.title, city.slug);
      return {
        "@type": "Dataset",
        "@id": cityDatasetId(base, city),
        name: `${PRICE_INDEX_NAME}: asking prices of flats in ${name}, Albania`,
        description: cityDescription(city, snapshot.asOf),
        url: `${base}${cityInfoPath(city, "en")}`,
        license: PRICE_INDEX_LICENSE_URL,
        temporalCoverage: snapshot.asOf,
        creator: organization(base),
        distribution: distribution(base, city),
      };
    }),
  };
}

/** `durres-asking-price-index-2026-10` → Durrës, October 2026. */
export type PriceIndexEdition = { citySlug: string; year: number; month: number };

export function parsePriceIndexEditionSlug(slug: string): PriceIndexEdition | null {
  const m = /^([a-z-]+?)-asking-price-index-(\d{4})-(\d{2})$/.exec(slug);
  if (!m) return null;
  const month = Number(m[3]);
  if (month < 1 || month > 12) return null;
  return { citySlug: m[1], year: Number(m[2]), month };
}

/** The Dataset of one monthly edition, published as a blog post. */
export function buildEditionDatasetJsonLd(input: {
  baseUrl: string;
  articleUrl: string;
  edition: PriceIndexEdition;
  cityName: string;
  /** The post's excerpt: it states the edition's figures. */
  description?: string;
  datePublished?: string;
  dateModified?: string;
}): object {
  const base = trimBase(input.baseUrl);
  const { edition, cityName } = input;
  const month = `${edition.year}-${String(edition.month).padStart(2, "0")}`;
  const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );
  const basis =
    `Monthly edition of the ${PRICE_INDEX_NAME} for ${cityName}, Albania, ${monthName}: asking prices of flats and studios ` +
    "listed for sale on Domlivo, by district and by size. Asking prices, not completed sales.";
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${input.articleUrl}#dataset`,
    name: `${PRICE_INDEX_NAME}, ${cityName}, ${monthName}`,
    description: input.description ? `${input.description} ${basis}` : basis,
    url: input.articleUrl,
    isAccessibleForFree: true,
    license: PRICE_INDEX_LICENSE_URL,
    keywords: keywords(cityName),
    temporalCoverage: month,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    creator: organization(base),
    publisher: organization(base),
    spatialCoverage: { "@type": "Place", name: `${cityName}, Albania` },
    measurementTechnique: MEASUREMENT_TECHNIQUE,
    isBasedOn: `${base}${methodologyPath("en")}`,
    includedInDataCatalog: catalogRef(base),
  };
}
