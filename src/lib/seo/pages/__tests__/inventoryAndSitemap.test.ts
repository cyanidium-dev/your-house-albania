import { describe, expect, it } from "vitest";
import {
  collectSeoPageCandidates,
  countSeoPageInventory,
  decideSeoPages,
  isIndexedSeoStatus,
  seoPageId,
  selectSeoLinks,
  type SeoDecisionSourceRows,
  type SeoInventoryRow,
  type SeoPageKey,
} from "..";

type Property = NonNullable<SeoDecisionSourceRows["properties"]>[number];

const flat = (district: string | undefined, bedrooms: number, extra: Partial<Property> = {}): Property => ({
  citySlug: "durres",
  districtSlug: district,
  deal: "sale",
  typeSlug: "apartment",
  bedrooms,
  price: 90000,
  priceUnit: "total",
  _updatedAt: "2026-09-01T00:00:00Z",
  ...extra,
});

const repeat = <T,>(n: number, make: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => make(i));

const source = (properties: Property[], over: Partial<SeoDecisionSourceRows> = {}): SeoDecisionSourceRows => ({
  cities: [
    { citySlug: "durres", countrySlug: "albania" },
    { citySlug: "sarande", countrySlug: "albania" },
    { citySlug: "kavaje", countrySlug: "albania" },
  ],
  districts: [
    { citySlug: "durres", districtSlug: "golem-durres" },
    { citySlug: "durres", districtSlug: "spille" },
  ],
  catalogNoIndex: [],
  properties,
  ...over,
});

/** Decisions without the shipped experiments, so these cases test the evidence rules alone. */
const decide = (s: SeoDecisionSourceRows) => decideSeoPages(s, undefined, []);

const find = (rows: ReturnType<typeof decideSeoPages>, key: SeoPageKey) => rows.find((r) => seoPageId(r.decision.key) === seoPageId(key));
const sitemap = (rows: ReturnType<typeof decideSeoPages>) => rows.filter((r) => isIndexedSeoStatus(r.decision.status)).map((r) => seoPageId(r.decision.key)).sort();

const durres: SeoPageKey = { family: "city", country: "albania", city: "durres" };
const golem: SeoPageKey = { family: "district", country: "albania", city: "durres", district: "golem-durres" };

describe("collectSeoPageCandidates", () => {
  const rows: SeoInventoryRow[] = [
    { country: "albania", city: "durres", district: "golem-durres", typeSlug: "apartment", bedrooms: 1, lastModified: new Date("2026-01-01") },
    { country: "albania", city: "durres", district: "golem-durres", typeSlug: "apartment", bedrooms: 2, lastModified: new Date("2026-03-01") },
    { country: "albania", city: "durres", district: null, typeSlug: "land", lastModified: new Date("2026-02-01") },
  ];
  const candidates = collectSeoPageCandidates(rows);
  const get = (key: SeoPageKey) => candidates.find((c) => seoPageId(c.key) === seoPageId(key));

  it("counts each page and its parent", () => {
    expect(get(durres)?.inventory).toEqual({ count: 3, parentCount: null });
    expect(get(golem)?.inventory).toEqual({ count: 2, parentCount: 3 });
    expect(get({ family: "cityType", country: "albania", city: "durres", type: "land" })?.inventory).toEqual({ count: 1, parentCount: 3 });
    expect(get({ family: "facet", country: "albania", city: "durres", district: "golem-durres", facet: "1-1" })?.inventory).toEqual({ count: 1, parentCount: 2 });
  });

  it("uses the newest listing as the page's last modification", () => {
    expect(get(durres)?.lastModified.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("does not generate pages without listings", () => {
    expect(get({ family: "facet", country: "albania", city: "durres", facet: "3-1" })).toBeUndefined();
    expect(collectSeoPageCandidates([])).toEqual([]);
  });

  it("agrees with the single-page counter", () => {
    for (const c of candidates) expect(countSeoPageInventory(rows, c.key)).toBe(c.inventory.count);
  });
});

describe("decideSeoPages → sitemap", () => {
  it("lists only indexed pages, and none for an empty inventory", () => {
    expect(sitemap(decide(source([])))).toEqual([]);
  });

  it("indexes the city and a district with demand, not a thin slice", () => {
    const props = [...repeat(40, (i) => flat("golem-durres", (i % 3) + 1)), ...repeat(12, () => flat("spille", 2))];
    const rows = decide(source(props));
    expect(sitemap(rows)).toEqual(["city:albania/durres", "district:albania/durres/golem-durres", "facet:albania/durres//1-1", "facet:albania/durres//2-1"].sort());
    expect(find(rows, { family: "district", country: "albania", city: "durres", district: "spille" })?.decision.status).toBe("noindex");
  });

  it("drops listings of hidden deals and cities without a country", () => {
    const props = [...repeat(10, () => flat(undefined, 1, { deal: "rent" })), ...repeat(10, () => flat(undefined, 1, { citySlug: "nowhere" }))];
    expect(decide(source(props))).toEqual([]);
  });

  it("counts a listing in an unpublished district for its city only", () => {
    const rows = decide(source(repeat(6, () => flat("hidden-district", 1))));
    expect(find(rows, durres)?.count).toBe(6);
    expect(rows.some((r) => r.decision.key.family === "district")).toBe(false);
  });

  it("applies a district's CMS noindex to its listing and facets, not the city", () => {
    const props = repeat(60, (i) => flat("golem-durres", (i % 2) + 1));
    const rows = decide(source(props, { catalogNoIndex: [{ pageScope: "district", citySlug: "durres", districtSlug: "golem-durres" }] }));
    expect(find(rows, golem)?.decision.status).toBe("noindex");
    expect(find(rows, durres)?.decision.status).toBe("index");
  });

  it("applies a city's noindex to every page of the city", () => {
    const rows = decide(source(repeat(60, () => flat("golem-durres", 1)), { cities: [{ citySlug: "durres", countrySlug: "albania", noIndex: true }] }));
    expect(sitemap(rows)).toEqual([]);
  });

  it("lists an experiment page like an indexed one", () => {
    const rows = decideSeoPages(source([...repeat(12, () => flat(undefined, 1, { price: 70000 })), ...repeat(12, () => flat(undefined, 3, { price: 250000 }))]));
    const under100k = find(rows, { family: "facet", country: "albania", city: "durres", facet: "under-100k" });
    expect(under100k?.decision.status).toBe("experiment");
    expect(sitemap(rows)).toContain("facet:albania/durres//under-100k");
  });

  it("carries the locales a page is indexed in", () => {
    const rows = decide(source(repeat(7, () => flat(undefined, 1, { citySlug: "sarande" }))));
    expect(find(rows, { family: "city", country: "albania", city: "sarande" })?.decision.indexableLocales).toEqual(["en", "ru", "sq", "it", "pl", "de"]);
  });

  describe("lastModified", () => {
    it("ignores the stamp of a script run and dates the page by its listings' own dates", () => {
      // Every fixture listing shares `_updatedAt` — the bulk-import case.
      const props = repeat(40, (i) => flat("golem-durres", 1, { _createdAt: `2026-0${(i % 5) + 1}-10T00:00:00Z` }));
      const rows = decide(source(props));
      expect(find(rows, durres)?.lastModified).toBe("2026-05-10T00:00:00.000Z");
      expect(find(rows, golem)?.lastModified).toBe("2026-05-10T00:00:00.000Z");
    });

    it("keeps an individual edit, which is newer than any creation", () => {
      const props = [...repeat(39, () => flat("golem-durres", 1)), flat("golem-durres", 1, { _updatedAt: "2026-09-21T09:00:00Z" })];
      expect(find(decide(source(props)), durres)?.lastModified).toBe("2026-09-21T09:00:00.000Z");
    });

    it("moves with the catalogSeoPage copy of the city or the district, not of another place", () => {
      const props = repeat(40, () => flat("golem-durres", 1, { _createdAt: "2026-05-10T00:00:00Z" }));
      const rows = decide(
        source(props, {
          catalogSeoPages: [
            { pageScope: "district", citySlug: "durres", districtSlug: "golem-durres", _updatedAt: "2026-09-22T12:00:00Z" },
            { pageScope: "city", citySlug: "durres", _updatedAt: "2026-09-19T12:00:00Z" },
          ],
        }),
      );
      expect(find(rows, golem)?.lastModified).toBe("2026-09-22T12:00:00.000Z");
      expect(find(rows, durres)?.lastModified).toBe("2026-09-19T12:00:00.000Z");
      expect(find(rows, { family: "facet", country: "albania", city: "durres", facet: "1-1" })?.lastModified).toBe("2026-09-19T12:00:00.000Z");
    });

    it("is null, not now, when nothing is known", () => {
      const rows = decide(source(repeat(6, () => flat(undefined, 1))));
      expect(find(rows, durres)?.lastModified).toBeNull();
    });
  });
});

describe("selectSeoLinks", () => {
  const props = [
    ...repeat(40, (i) => flat("golem-durres", (i % 3) + 1)),
    ...repeat(12, () => flat("spille", 2)),
    ...repeat(7, () => flat(undefined, 1, { citySlug: "sarande" })),
  ];
  const rows = decide(source(props));
  const candidates = rows.map((r) => ({ decision: r.decision, count: r.count }));

  it("links a city to its indexable districts and facets only", () => {
    const links = selectSeoLinks({ from: durres, locale: "en", candidates });
    expect(links.map((l) => seoPageId(l.key))).toEqual(["district:albania/durres/golem-durres", "facet:albania/durres//1-1", "facet:albania/durres//2-1"]);
    expect(links.every((l) => !l.current)).toBe(true);
    expect(links.map((l) => l.group)).toEqual(["districts", "rooms", "rooms"]);
  });

  it("never links to another city or to itself as a link", () => {
    const links = selectSeoLinks({ from: golem, locale: "en", candidates });
    expect(links.some((l) => l.key.city !== "durres")).toBe(false);
    expect(links.some((l) => l.key.family === "district")).toBe(false);
  });

  it("keeps the current facet visible even when it is not indexed", () => {
    const current: SeoPageKey = { family: "facet", country: "albania", city: "durres", facet: "3-1" };
    const links = selectSeoLinks({ from: current, locale: "en", candidates });
    expect(links.find((l) => l.current)?.key).toEqual(current);
  });

  it("does not link a page in a locale it is not indexed in", () => {
    const sarande: SeoPageKey = { family: "city", country: "albania", city: "sarande" };
    const onlySarandeFacets = selectSeoLinks({ from: sarande, locale: "uk", candidates });
    expect(onlySarandeFacets).toEqual([]);
  });
});
