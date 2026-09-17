import { describe, expect, it } from "vitest";
import {
  KEYWORD_CLUSTERS,
  SEO_EXPERIMENTS,
  seoPageId,
  seoPageKeyFromListingRoute,
  seoPagePath,
  validateSeoRegistry,
  type KeywordCluster,
  type SeoExperiment,
  type SeoPageKey,
} from "..";

const keys: Array<[SeoPageKey, string]> = [
  [{ family: "city", country: "albania", city: "durres" }, "/sq/albania/durres"],
  [{ family: "district", country: "albania", city: "durres", district: "golem-durres" }, "/sq/albania/durres/golem-durres"],
  [{ family: "cityType", country: "albania", city: "durres", type: "land" }, "/sq/albania/durres/sale/land"],
  [{ family: "facet", country: "albania", city: "durres", facet: "1-1" }, "/sq/albania/durres/1-1"],
  [{ family: "facet", country: "albania", city: "durres", district: "plazh", facet: "near-the-sea" }, "/sq/albania/durres/plazh/near-the-sea"],
];

describe("seoPagePath", () => {
  it.each(keys)("builds the canonical path of %j", (key, path) => {
    expect(seoPagePath(key, "sq")).toBe(path);
  });

  it("never carries a query string or uppercase", () => {
    for (const [key] of keys) {
      for (const locale of ["en", "uk", "de"]) {
        const p = seoPagePath(key, locale);
        expect(p).not.toContain("?");
        expect(p).toBe(p.toLowerCase());
        expect(p.startsWith(`/${locale}/`)).toBe(true);
      }
    }
  });

  it("gives every page a distinct path and id", () => {
    expect(new Set(keys.map(([k]) => seoPagePath(k, "en"))).size).toBe(keys.length);
    expect(new Set(keys.map(([k]) => seoPageId(k))).size).toBe(keys.length);
  });
});

describe("seoPageKeyFromListingRoute", () => {
  it("maps each registry route back to its key", () => {
    expect(seoPageKeyFromListingRoute({ country: "albania", city: "durres" })).toEqual(keys[0][0]);
    expect(seoPageKeyFromListingRoute({ country: "albania", city: "durres", district: "golem-durres" })).toEqual(keys[1][0]);
    expect(seoPageKeyFromListingRoute({ country: "albania", city: "durres", dealSegment: "sale", type: "land" })).toEqual(keys[2][0]);
    expect(seoPageKeyFromListingRoute({ country: "albania", city: "durres", facet: "1-1" })).toEqual(keys[3][0]);
    expect(seoPageKeyFromListingRoute({ country: "Albania", city: "DURRES", district: "plazh", facet: "near-the-sea" })).toEqual(keys[4][0]);
  });

  it("returns null for shapes that are no registry page", () => {
    const none = [
      { country: "albania", city: "durres", dealSegment: "sale" },
      { country: "albania", city: "durres", type: "apartment" },
      { country: "albania", city: "durres", dealSegment: "rent", type: "apartment" },
      { country: "albania", city: "durres", district: "golem-durres", dealSegment: "sale", type: "apartment" },
      { country: "albania", city: "durres", dealSegment: "sale", facet: "1-1" },
      { country: "albania", city: "durres", facet: "penthouses" },
      { country: "", city: "durres" },
    ];
    for (const route of none) expect(seoPageKeyFromListingRoute(route)).toBeNull();
  });

  it("round-trips: the key of a page's own path is the page", () => {
    for (const [key] of keys) {
      const [, , country, city, ...rest] = seoPagePath(key, "en").split("/");
      const route =
        key.family === "cityType"
          ? { country, city, dealSegment: rest[0], type: rest[1] }
          : key.family === "facet"
            ? { country, city, district: key.district, facet: rest[rest.length - 1] }
            : { country, city, district: rest[0] };
      expect(seoPageKeyFromListingRoute(route)).toEqual(key);
    }
  });
});

describe("validateSeoRegistry", () => {
  it("accepts the shipped evidence", () => {
    expect(validateSeoRegistry()).toEqual([]);
  });

  const base = KEYWORD_CLUSTERS.find((c) => c.id === "golem-apartments") as KeywordCluster;

  it("rejects a second sale cluster for the same page", () => {
    const dup = { ...base, id: "golem-copy", primaryKeyword: "golem flats", secondaryKeywords: [] };
    expect(validateSeoRegistry([...KEYWORD_CLUSTERS, dup]).join("\n")).toMatch(/both target/);
  });

  it("allows a rentals cluster on a sale page's target", () => {
    const rentals = { ...base, id: "golem-rentals", primaryKeyword: "golem apartments to rent", secondaryKeywords: [], serp: "rentals" as const };
    expect(validateSeoRegistry([...KEYWORD_CLUSTERS, rentals])).toEqual([]);
  });

  it("rejects the same keyword in two clusters", () => {
    const other = { ...base, id: "qerret-copy", target: { family: "district" as const, country: "albania", city: "durres", district: "spille" }, primaryKeyword: "Apartamente  ne shitje golem", secondaryKeywords: [] };
    expect(validateSeoRegistry([...KEYWORD_CLUSTERS, other]).join("\n")).toMatch(/is in both/);
  });

  it("rejects duplicate ids, missing sources, locales and markets", () => {
    const bad = { ...base, primaryKeyword: "x1", secondaryKeywords: [], sources: [], locales: [], markets: [], target: { family: "district" as const, country: "albania", city: "durres", district: "spille" } };
    const errors = validateSeoRegistry([...KEYWORD_CLUSTERS, bad]).join("\n");
    expect(errors).toMatch(/duplicate cluster id/);
    expect(errors).toMatch(/no evidence source/);
    expect(errors).toMatch(/no locale/);
    expect(errors).toMatch(/no market/);
  });

  it("rejects a slice whose city has no cluster, and a non-slug", () => {
    const orphan: KeywordCluster = { ...base, id: "lezhe-land", primaryKeyword: "toke ne shitje lezhe", secondaryKeywords: [], target: { family: "cityType", country: "albania", city: "Lezhe", type: "land" } };
    const errors = validateSeoRegistry([...KEYWORD_CLUSTERS, orphan]).join("\n");
    expect(errors).toMatch(/no listing cluster for its city/);
    expect(errors).toMatch(/not a lowercase slug/);
  });
});

const NL = "\n";

describe("validateSeoRegistry: experiments", () => {
  const e = SEO_EXPERIMENTS[0];

  it("rejects two experiments on one page, bad dates and long runs", () => {
    const errors = validateSeoRegistry(KEYWORD_CLUSTERS, [
      e,
      { ...e, id: "copy" },
      { ...e, id: "backwards", target: { ...e.target, facet: "3-1" } as SeoExperiment["target"], reviewAt: "2026-09-01" },
      { ...e, id: "forever", target: { ...e.target, facet: "under-80k" } as SeoExperiment["target"], reviewAt: "2027-09-01" },
    ]).join(NL);
    expect(errors).toMatch(/two experiments target/);
    expect(errors).toMatch(/backwards: reviewAt must be after startedAt/);
    expect(errors).toMatch(/forever: runs \d+ days/);
  });

  it("rejects an experiment in a city nobody searches for", () => {
    const orphan = { ...e, id: "kavaje", target: { family: "city" as const, country: "albania", city: "kavaje" } };
    expect(validateSeoRegistry(KEYWORD_CLUSTERS, [orphan]).join(NL)).toMatch(/no locale to index it in/);
  });
});
