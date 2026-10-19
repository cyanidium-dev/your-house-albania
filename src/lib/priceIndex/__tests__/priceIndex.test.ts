import { describe, expect, it } from "vitest";
import {
  buildPriceIndexSnapshot,
  computePriceIndexFigures,
  findIndexCity,
  MIN_HEADLINE_SAMPLE,
  type PriceIndexListingRow,
} from "../snapshot";
import { buildCityCsv, buildPriceIndexJson, CITY_CSV_COLUMNS, citationLine, PRICE_INDEX_LICENSE_URL } from "../publish";
import {
  buildCityDatasetJsonLd,
  buildEditionDatasetJsonLd,
  buildPriceIndexCatalogJsonLd,
  cityHeadline,
  parsePriceIndexEditionSlug,
} from "../jsonLd";
import { interpolatePriceIndexTokens, replacePriceIndexTokens } from "../tokens";
import { keyFiguresMarkdown, llmsFullText } from "../llmsText";

/** `n` flats in a district at €1,000, €1,010, … per m² (100 m² each). */
function flats(n: number, city: string, district: string, extra: Partial<PriceIndexListingRow> = {}): PriceIndexListingRow[] {
  return Array.from({ length: n }, (_, i) => ({
    price: (1000 + i * 10) * 100,
    area: 100,
    type: "apartment",
    c: city,
    d: district,
    ...extra,
  }));
}

const BASE = "https://www.domlivo.com";
const COMPUTED_AT = "2026-10-19T08:30:00.000Z";

function sampleSnapshot() {
  return buildPriceIndexSnapshot({
    rows: [
      ...flats(40, "durres", "plazh"),
      ...flats(10, "durres", "golem", { stage: "off-plan" }),
      { price: 50000, area: 400, type: "land", c: "durres", d: "plazh" },
      ...flats(11, "tirana", "blloku"),
      ...flats(3, "durres", "hidden-district"),
    ],
    cities: [
      { slug: "durres", title: { en: "Durrës", ru: "Дуррес" }, country: "albania" },
      { slug: "tirana", title: { en: "Tirana" }, country: "albania" },
    ],
    districts: [
      { slug: "plazh", title: { en: "Plazh" } },
      { slug: "golem", title: { en: "Golem, Durrës" } },
      { slug: "blloku", title: { en: "Blloku" } },
    ],
    computedAt: COMPUTED_AT,
  });
}

describe("computePriceIndexFigures", () => {
  it("takes the median and the 20–80% band over flats only, and counts every listing", () => {
    const f = computePriceIndexFigures([
      ...flats(5, "x", "y"),
      { price: 90000, area: 300, type: "land" },
      { price: 2000, priceUnit: "per-sqm", area: 70, type: "studio" },
    ]);
    // €/m²: 1000, 1010, 1020, 1030, 1040, 2000 → median (1020 + 1030) / 2.
    expect(f.median).toBe(1025);
    expect(f.p20).toBe(1010);
    expect(f.p80).toBe(1040);
    expect(f.count).toBe(6);
    expect(f.flats).toBe(6);
    expect(f.listings).toBe(7);
    expect(f.flatPriceFrom).toBe(100000);
  });

  it("leaves out areas under 15 m² and listings without a price", () => {
    const f = computePriceIndexFigures([
      { price: 100000, area: 100, type: "apartment" },
      { price: 100000, area: 10, type: "apartment" },
      { price: 0, area: 50, type: "apartment" },
    ]);
    expect(f.count).toBe(1);
    expect(f.median).toBe(1000);
  });

  it(`is a headline figure from ${MIN_HEADLINE_SAMPLE} flats, not one below`, () => {
    expect(computePriceIndexFigures(flats(MIN_HEADLINE_SAMPLE - 1, "x", "y")).reliable).toBe(false);
    expect(computePriceIndexFigures(flats(MIN_HEADLINE_SAMPLE, "x", "y")).reliable).toBe(true);
  });
});

describe("buildPriceIndexSnapshot", () => {
  const snapshot = sampleSnapshot();

  it("dates the snapshot by the read", () => {
    expect(snapshot.asOf).toBe("2026-10-19");
    expect(snapshot.computedAt).toBe(COMPUTED_AT);
  });

  it("groups by published city and district, largest first", () => {
    expect(snapshot.cities.map((c) => c.slug)).toEqual(["durres", "tirana"]);
    const durres = findIndexCity(snapshot, "durres")!;
    expect(durres.listings).toBe(54);
    expect(durres.count).toBe(53);
    // The unpublished district counts towards the city but gets no row.
    expect(durres.districts.map((d) => d.slug)).toEqual(["plazh", "golem"]);
    expect(durres.newBuild.count).toBe(10);
    expect(durres.completed.count).toBe(43);
    expect(durres.reliable).toBe(true);
    expect(findIndexCity(snapshot, "tirana")!.reliable).toBe(false);
    expect(snapshot.national.listings).toBe(65);
  });
});

describe("downloads", () => {
  const snapshot = sampleSnapshot();
  const durres = findIndexCity(snapshot, "durres")!;

  it("writes the city CSV: header, whole city, districts, CRLF, quoted where needed", () => {
    const csv = buildCityCsv(durres, snapshot.asOf);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(CITY_CSV_COLUMNS.join(","));
    expect(lines[1].startsWith("Durrës,,,2026-10-19,")).toBe(true);
    expect(lines[2].startsWith("Durrës,Plazh,plazh,2026-10-19,")).toBe(true);
    // "Golem, Durrës" has a comma, so it is quoted; 10 flats is a low sample.
    expect(lines[3]).toMatch(/^Durrës,"Golem, Durrës",golem,2026-10-19,.*,true$/);
    expect(lines.at(-1)).toBe("");
    expect(lines).toHaveLength(5);
  });

  it("writes the index JSON with licence, method and absolute URLs", () => {
    const json = buildPriceIndexJson(snapshot, `${BASE}/`);
    expect(json.license).toBe(PRICE_INDEX_LICENSE_URL);
    expect(json.date).toBe("2026-10-19");
    expect(json.methodology).toBe(`${BASE}/en/methodology`);
    expect(json.minHeadlineSample).toBe(MIN_HEADLINE_SAMPLE);
    const city = json.cities[0];
    expect(city.url).toBe(`${BASE}/en/albania/durres/info`);
    expect(city.csv).toBe(`${BASE}/data/prices/durres.csv`);
    expect(city.medianEurPerSqm).toBe(durres.median);
    expect(city.lowSample).toBe(false);
    expect(city.monthOverMonthPct).toBeNull();
    expect(json.cities[1].lowSample).toBe(true);
    expect(JSON.parse(JSON.stringify(json))).toEqual(json);
  });

  it("formats the citation line", () => {
    expect(citationLine("Durrës", "2026-10-19", `${BASE}/en/albania/durres/info`)).toBe(
      `Domlivo Price Index, Durrës, 2026-10-19, ${BASE}/en/albania/durres/info`,
    );
  });
});

/** The JSON-LD fields the tests read. */
type Ld = {
  "@type": string;
  "@id": string;
  url: string;
  name: string;
  description: string;
  license: string;
  temporalCoverage: string;
  isBasedOn: string;
  keywords: string[];
  creator: object;
  distribution: Array<{ encodingFormat: string; contentUrl: string }>;
  variableMeasured: Array<{ value?: number }>;
  hasPart: Array<{ "@id": string }>;
};

describe("JSON-LD", () => {
  const snapshot = sampleSnapshot();
  const durres = findIndexCity(snapshot, "durres")!;
  const tirana = findIndexCity(snapshot, "tirana")!;

  it("puts the headline figure, licence and downloads on the city Dataset", () => {
    const ld = buildCityDatasetJsonLd({ baseUrl: BASE, locale: "ru", snapshot, city: durres }) as Ld;
    expect(ld["@type"]).toBe("Dataset");
    expect(ld["@id"]).toBe(`${BASE}/en/albania/durres/info#price-index`);
    expect(ld.url).toBe(`${BASE}/ru/albania/durres/info`);
    expect(ld.description).toContain(`€${new Intl.NumberFormat("en-GB").format(durres.median!)} per m² on 19 October 2026`);
    expect(ld.license).toBe(PRICE_INDEX_LICENSE_URL);
    expect(ld.distribution.map((d) => d.encodingFormat)).toEqual(["text/csv", "application/json"]);
    expect(ld.distribution[0].contentUrl).toBe(`${BASE}/data/prices/durres.csv`);
    expect(ld.creator).toMatchObject({ "@type": "Organization", name: "Domlivo", url: `${BASE}/` });
    expect(ld.temporalCoverage).toBe("2026-10-19");
    expect(ld.keywords.length).toBeGreaterThan(0);
    expect(ld.variableMeasured[0].value).toBe(durres.median);
  });

  it("says why a small city has no headline figure", () => {
    expect(cityHeadline(tirana, snapshot.asOf)).toContain("Too little data for a headline figure in Tirana: 11 flats");
  });

  it("lists every city dataset in the catalog", () => {
    const ld = buildPriceIndexCatalogJsonLd({ baseUrl: BASE, locale: "en", snapshot }) as Ld;
    expect(ld["@type"]).toBe("DataCatalog");
    expect(ld.hasPart.map((d) => d["@id"])).toEqual([
      `${BASE}/en/albania/durres/info#price-index`,
      `${BASE}/en/albania/tirana/info#price-index`,
    ]);
  });

  it("reads a monthly edition from its slug and dates it to the month", () => {
    expect(parsePriceIndexEditionSlug("durres-asking-price-index-2026-10")).toEqual({ citySlug: "durres", year: 2026, month: 10 });
    expect(parsePriceIndexEditionSlug("tirana-apartment-prices-2026")).toBeNull();
    expect(parsePriceIndexEditionSlug("durres-asking-price-index-2026-13")).toBeNull();
    const ld = buildEditionDatasetJsonLd({
      baseUrl: BASE,
      articleUrl: `${BASE}/en/blog/durres-asking-price-index-2026-10`,
      edition: { citySlug: "durres", year: 2026, month: 10 },
      cityName: "Durrës",
    }) as Ld;
    expect(ld.temporalCoverage).toBe("2026-10");
    expect(ld.name).toBe("Domlivo Price Index, Durrës, October 2026");
    expect(ld.isBasedOn).toBe(`${BASE}/en/methodology`);
  });
});

describe("tokens in CMS copy", () => {
  const snapshot = sampleSnapshot();
  const durres = findIndexCity(snapshot, "durres")!;

  it("replaces the figure, sample and date in the page's language", () => {
    expect(replacePriceIndexTokens("€{{median:durres}}/m², {{count:durres}} flats, {{date:durres}}", snapshot, "en")).toBe(
      `€${new Intl.NumberFormat("en").format(durres.median!)}/m², 53 flats, Oct 19, 2026`,
    );
    expect(replacePriceIndexTokens("{{median:nowhere}}", snapshot, "en")).toBe("—");
    expect(replacePriceIndexTokens("{{median:durres}}", null, "en")).toBe("—");
  });

  it("reads a district or a facet slice of the city, and the count and price fields", () => {
    const facetSnapshot = buildPriceIndexSnapshot({
      rows: [
        ...flats(4, "durres", "plazh", { bedrooms: 1, price: 70000 }),
        ...flats(2, "durres", "plazh", { bedrooms: 2, price: 150000 }),
        ...flats(3, "durres", "golem", { bedrooms: 1, price: 90000, sea: 120 }),
        { price: 50000, area: 400, type: "land", c: "durres", d: "plazh" },
      ],
      cities: [{ slug: "durres", title: { en: "Durrës" }, country: "albania" }],
      districts: [{ slug: "plazh" }, { slug: "golem" }],
      computedAt: COMPUTED_AT,
    });
    const r = (text: string) => replacePriceIndexTokens(text, facetSnapshot, "en");
    expect(r("{{listings:durres}} / {{flats:durres}}")).toBe("10 / 9");
    expect(r("{{count:durres/1-1}} from €{{from:durres/1-1}}")).toBe("7 from €70,000");
    expect(r("{{listings:durres/plazh}}")).toBe("7");
    expect(r("{{count:durres/near-the-sea}}")).toBe("3");
    expect(r("{{price:durres/under-100k}}")).toBe("70,000");
    expect(r("{{count:durres/3-1}} {{median:durres/nowhere}}")).toBe("— —");
  });

  it("returns untouched objects as they were and rebuilds only changed branches", () => {
    const untouched = { a: [{ text: "no token" }] };
    expect(interpolatePriceIndexTokens(untouched, snapshot, "en")).toBe(untouched);
    const doc = { keep: { x: "plain" }, faq: [{ answer: { en: "About €{{median:durres}}/m²." } }] };
    const out = interpolatePriceIndexTokens(doc, snapshot, "en");
    expect(out.keep).toBe(doc.keep);
    expect(out.faq[0].answer.en).not.toContain("{{");
    expect(doc.faq[0].answer.en).toContain("{{");
  });
});

describe("llms text", () => {
  const snapshot = sampleSnapshot();

  it("prints one key-figures line per city, the small one flagged", () => {
    const md = keyFiguresMarkdown(snapshot, BASE);
    expect(md).toContain("## Key figures");
    expect(md).toMatch(/- Durrës: €[\d,]+\/m² median asking price, 53 flats, 2026-10-19: https:\/\/www\.domlivo\.com\/en\/albania\/durres\/info/);
    expect(md).toContain("- Tirana: too little data for a headline figure (11 flats");
    expect(md).toContain(`${BASE}/data/prices/index.json`);
  });

  it("writes the methodology and a table per city", () => {
    const copy = new Proxy({} as Record<string, string>, { get: (_t, key) => `${String(key)} {min}` });
    const text = llmsFullText(snapshot, BASE, copy);
    expect(text).toContain(`thresholdTitle ${MIN_HEADLINE_SAMPLE}`);
    expect(text).toContain("### Durrës");
    expect(text).toContain("| All of Tirana |");
    expect(text).toMatch(/\| Golem, Durrës \| €[\d,]+\* \|/);
  });
});
