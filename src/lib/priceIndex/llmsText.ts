/**
 * The Domlivo Price Index as plain text for `/llms.txt` and `/llms-full.txt`:
 * one line per city with its figure, sample, date and page, and the full
 * district tables. Pure; the routes fetch the snapshot and the copy.
 */
import { MIN_HEADLINE_SAMPLE, type PriceIndexFigures, type PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import {
  cityCsvPath,
  cityInfoPath,
  citationLine,
  methodologyPath,
  placeName,
  PRICE_INDEX_JSON_PATH,
  PRICE_INDEX_LICENSE_NAME,
  PRICE_INDEX_LICENSE_URL,
  PRICE_INDEX_NAME,
} from "@/lib/priceIndex/publish";

const num = (n: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(n);
const eur = (n: number | null) => (n === null ? "-" : `€${num(n)}`);
const flatsText = (n: number) => `${n} ${n === 1 ? "flat" : "flats"}`;

function trimBase(base: string): string {
  return base.replace(/\/$/, "");
}

/** "€1,500/m² median, 511 flats" or "too little data for a headline figure (11 flats)". */
function figureText(f: PriceIndexFigures): string {
  if (f.median === null) return "no priced flats";
  if (!f.reliable) return `too little data for a headline figure (${flatsText(f.count)}; indicative median ${eur(f.median)}/m²)`;
  return `${eur(f.median)}/m² median asking price, ${flatsText(f.count)}`;
}

/** The "Key figures" section of llms.txt. */
export function keyFiguresMarkdown(snapshot: PriceIndexSnapshot, baseUrl: string): string {
  const base = trimBase(baseUrl);
  const lines = snapshot.cities
    .filter((c) => c.flats > 0)
    .map((c) => {
      const name = placeName(c.title, c.slug);
      return `- ${name}: ${figureText(c)}, ${snapshot.asOf}: ${base}${cityInfoPath(c, "en")} (CSV: ${base}${cityCsvPath(c.slug)})`;
    });
  return [
    "## Key figures",
    "",
    `${PRICE_INDEX_NAME}: median asking price per m² of the flats and studios listed for sale on Domlivo, computed ${snapshot.asOf} from the live listings and recomputed hourly. Asking prices, not completed sales. A median over fewer than ${MIN_HEADLINE_SAMPLE} flats is not a headline figure. Cite as "${citationLine("<city>", "<date>", "<URL>")}"; licence ${PRICE_INDEX_LICENSE_NAME}.`,
    "",
    ...lines,
    "",
    `- [All cities and districts (JSON)](${base}${PRICE_INDEX_JSON_PATH})`,
    `- [Methodology: sample, filters, median and range, how to cite](${base}${methodologyPath("en")})`,
  ].join("\n");
}

export type MethodologyCopy = Record<string, string>;

const METHOD_KEYS = ["asking", "sample", "filters", "threshold", "median", "frequency", "research"] as const;

/** Fills the `{min}` placeholder the methodology copy uses; the copy has no other. */
function fill(text: string): string {
  return text.replace(/\{min\}/g, String(MIN_HEADLINE_SAMPLE));
}

function tableRow(label: string, f: PriceIndexFigures): string {
  const band = f.p20 !== null && f.p80 !== null ? `${eur(f.p20)}–${eur(f.p80)}` : "-";
  const median = f.median === null ? "-" : `${eur(f.median)}${f.reliable ? "" : "*"}`;
  return `| ${label} | ${median} | ${band} | ${f.count} | ${f.flats} | ${f.listings} | ${eur(f.medianFlatPrice)} |`;
}

/** `/llms-full.txt`: the methodology in full, then every city's district table. */
export function llmsFullText(snapshot: PriceIndexSnapshot, baseUrl: string, copy: MethodologyCopy): string {
  const base = trimBase(baseUrl);
  const out: string[] = [
    `# ${PRICE_INDEX_NAME}`,
    "",
    `> ${fill(copy.lead)}`,
    "",
    `Figures computed ${snapshot.asOf} (${snapshot.computedAt}). Methodology: ${base}${methodologyPath("en")}. Data: ${base}${PRICE_INDEX_JSON_PATH}. Licence: ${PRICE_INDEX_LICENSE_NAME}, ${PRICE_INDEX_LICENSE_URL}.`,
    "",
    `## ${copy.methodTitle}`,
    "",
  ];
  for (const key of METHOD_KEYS) {
    out.push(`### ${fill(copy[`${key}Title`])}`, "", fill(copy[`${key}Body`]), "");
  }
  out.push(
    `## ${copy.citeTitle}`,
    "",
    copy.citeBody,
    "",
    `    ${copy.citeTemplate}`,
    "",
    `## ${copy.licenceTitle}`,
    "",
    `${copy.licenceBody} ${PRICE_INDEX_LICENSE_URL}`,
    "",
    "## Figures by city and district",
    "",
    `Columns: median asking price per m²; 20th–80th percentile per m²; flats with a price per m² (the sample); flats and studios listed; sale listings of every type; median asking price of a flat. * = fewer than ${MIN_HEADLINE_SAMPLE} flats, indicative only.`,
    "",
  );
  for (const city of snapshot.cities) {
    if (city.flats === 0) continue;
    const name = placeName(city.title, city.slug);
    out.push(
      `### ${name}`,
      "",
      `${PRICE_INDEX_NAME}, ${name}, ${snapshot.asOf}: ${figureText(city)}. Page: ${base}${cityInfoPath(city, "en")}. CSV: ${base}${cityCsvPath(city.slug)}.`,
      "",
      "| Place | Median €/m² | 20–80th percentile €/m² | Sample | Flats | Listings | Median flat price |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      tableRow(`All of ${name}`, city),
      tableRow("New builds (off-plan, under construction)", city.newBuild),
      tableRow("Completed homes", city.completed),
      ...city.districts.filter((d) => d.flats > 0).map((d) => tableRow(placeName(d.title, d.slug), d)),
      "",
    );
  }
  return `${out.join("\n").trimEnd()}\n`;
}
