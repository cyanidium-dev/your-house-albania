import { describe, expect, it } from "vitest";
import {
  KEYWORD_CLUSTERS,
  SEO_PAGE_POLICY,
  evaluateSeoPage,
  findDemand,
  isSeoPageIndexableIn,
  type KeywordCluster,
  type SeoExperiment,
  type SeoPageKey,
} from "..";

const durres: SeoPageKey = { family: "city", country: "albania", city: "durres" };
const golem: SeoPageKey = { family: "district", country: "albania", city: "durres", district: "golem-durres" };

const cluster = (over: Partial<KeywordCluster> & Pick<KeywordCluster, "id" | "target">): KeywordCluster => ({
  primaryKeyword: over.id,
  secondaryKeywords: [],
  markets: ["AL"],
  locales: ["sq", "en"],
  bucket: "10-100",
  serp: "listings",
  sources: ["kp-albania-2026-09-17"],
  ...over,
});

describe("findDemand", () => {
  it("scores a page with its own cluster by the cluster's bucket", () => {
    expect(findDemand(durres)).toMatchObject({ score: 3, inferred: false, clusterIds: ["durres-property"] });
    expect(findDemand({ family: "district", country: "albania", city: "durres", district: "qerret" }).score).toBe(2);
  });

  it("infers a low score from the city for a slice without its own cluster", () => {
    const d = findDemand({ family: "district", country: "albania", city: "durres", district: "spille" });
    expect(d).toMatchObject({ score: 1, inferred: true, clusterIds: ["durres-property"] });
  });

  it("finds nothing for a city nobody searches for", () => {
    expect(findDemand({ family: "city", country: "albania", city: "kavaje" })).toMatchObject({ score: 0, locales: [] });
  });

  it("ignores clusters whose SERP is rentals", () => {
    const key: SeoPageKey = { family: "facet", country: "albania", city: "durres", facet: "near-the-sea" };
    const onlyRentals = KEYWORD_CLUSTERS.filter((c) => c.id !== "durres-near-sea");
    expect(findDemand(key, onlyRentals)).toMatchObject({ score: 1, inferred: true });
  });

  it("takes the page's locales from its city, in routing order", () => {
    expect(findDemand(golem).locales).toEqual(["en", "uk", "ru", "sq", "it", "pl", "de"]);
    expect(findDemand({ family: "city", country: "albania", city: "sarande" }).locales).toEqual(["en", "ru", "sq", "it", "pl", "de"]);
  });
});

describe("evaluateSeoPage", () => {
  it("indexes Durrës in every locale as tier 1", () => {
    const d = evaluateSeoPage({ key: durres, inventory: { count: 358 } });
    expect(d.status).toBe("index");
    expect(d.tier).toBe(1);
    expect(d.indexableLocales).toHaveLength(7);
  });

  it("does not generate a page with no inventory, or a failed count", () => {
    expect(evaluateSeoPage({ key: durres, inventory: { count: 0 } }).status).toBe("skip");
    expect(evaluateSeoPage({ key: durres, inventory: { count: Number.NaN } }).status).toBe("skip");
    expect(evaluateSeoPage({ key: durres, inventory: { count: -3 } }).status).toBe("skip");
  });

  it("does not generate a key with empty slugs", () => {
    expect(evaluateSeoPage({ key: { family: "district", country: "albania", city: "durres", district: " " }, inventory: { count: 50 } }).status).toBe("skip");
  });

  it("holds a city with demand but thin stock as tier 3", () => {
    const d = evaluateSeoPage({ key: { family: "city", country: "albania", city: "tirana" }, inventory: { count: SEO_PAGE_POLICY.city.minInventory - 1 } });
    expect(d).toMatchObject({ status: "noindex", tier: 3, indexableLocales: [] });
  });

  it("never indexes a city without keyword evidence, however large", () => {
    const d = evaluateSeoPage({ key: { family: "city", country: "albania", city: "kavaje" }, inventory: { count: 500 } });
    expect(d.status).toBe("noindex");
    expect(d.tier).toBeNull();
    expect(d.reasons.join(" ")).toMatch(/no keyword evidence/);
  });

  it("indexes a district on the city's demand only with enough stock", () => {
    const spille: SeoPageKey = { family: "district", country: "albania", city: "durres", district: "spille" };
    const min = SEO_PAGE_POLICY.district.inferredDemandMinInventory;
    expect(evaluateSeoPage({ key: spille, inventory: { count: min } }).status).toBe("index");
    expect(evaluateSeoPage({ key: spille, inventory: { count: min - 1 } }).status).toBe("noindex");
  });

  it("does not infer demand for types and facets", () => {
    const commercial: SeoPageKey = { family: "cityType", country: "albania", city: "durres", type: "commercial-space" };
    expect(evaluateSeoPage({ key: commercial, inventory: { count: 200, parentCount: 1000 } }).status).toBe("noindex");
  });

  it("noindexes a type that is most of its city: same intent as the city page", () => {
    const apartment: SeoPageKey = { family: "cityType", country: "albania", city: "durres", type: "apartment" };
    const clusters = [...KEYWORD_CLUSTERS, cluster({ id: "durres-apartment-test", target: apartment, bucket: "100-1K" })];
    const d = evaluateSeoPage({ key: apartment, inventory: { count: 244, parentCount: 358 }, clusters });
    expect(d.status).toBe("noindex");
    expect(d.reasons.join(" ")).toMatch(/duplicate intent/);
    expect(evaluateSeoPage({ key: apartment, inventory: { count: 100, parentCount: 358 }, clusters }).status).toBe("index");
  });

  it("noindexes a facet that is nearly all of its place", () => {
    const oneBed: SeoPageKey = { family: "facet", country: "albania", city: "durres", facet: "1-1" };
    expect(evaluateSeoPage({ key: oneBed, inventory: { count: 95, parentCount: 100 } }).status).toBe("noindex");
    expect(evaluateSeoPage({ key: oneBed, inventory: { count: 151, parentCount: 358 } }).status).toBe("index");
  });

  it("lets the CMS force noindex, never force index", () => {
    expect(evaluateSeoPage({ key: durres, inventory: { count: 358 }, editorialNoindex: true }).status).toBe("noindex");
    const kavaje: SeoPageKey = { family: "city", country: "albania", city: "kavaje" };
    expect(evaluateSeoPage({ key: kavaje, inventory: { count: 358 }, editorialNoindex: false }).status).toBe("noindex");
  });

  it("indexes a page only in the locales with demand for its place", () => {
    const d = evaluateSeoPage({ key: { family: "city", country: "albania", city: "sarande" }, inventory: { count: 7 } });
    expect(isSeoPageIndexableIn(d, "pl")).toBe(true);
    expect(isSeoPageIndexableIn(d, "ru")).toBe(true);
    expect(isSeoPageIndexableIn(d, "uk")).toBe(false);
  });

  it("indexes nothing when the page's city has no cluster to give it locales", () => {
    const key: SeoPageKey = { family: "cityType", country: "albania", city: "lezhe", type: "land" };
    const clusters = [cluster({ id: "lezhe-land", target: key, bucket: "100-1K" })];
    const d = evaluateSeoPage({ key, inventory: { count: 40, parentCount: 100 }, clusters });
    expect(d.status).toBe("noindex");
    expect(d.reasons.join(" ")).toMatch(/no locale/);
  });

  it("explains every decision", () => {
    for (const count of [0, 3, 12, 40, 400]) {
      expect(evaluateSeoPage({ key: golem, inventory: { count } }).reasons.length).toBeGreaterThan(0);
    }
  });
});

describe("experiments", () => {
  const under100k: SeoPageKey = { family: "facet", country: "albania", city: "durres", facet: "under-100k" };
  const experiment: SeoExperiment = {
    id: "test-under-100k",
    target: under100k,
    hypothesis: "budget intent",
    successCriteria: "budget queries land here",
    startedAt: "2026-09-17",
    reviewAt: "2026-11-12",
  };

  it("indexes a page without keyword evidence while the experiment runs", () => {
    const d = evaluateSeoPage({ key: under100k, inventory: { count: 106, parentCount: 358 }, experiments: [experiment] });
    expect(d.status).toBe("experiment");
    expect(d.experiment?.id).toBe("test-under-100k");
    expect(isSeoPageIndexableIn(d, "uk")).toBe(true);
    expect(d.reasons.join(" ")).toMatch(/review 2026-11-12/);
  });

  it("falls back to noindex once the experiment is removed", () => {
    expect(evaluateSeoPage({ key: under100k, inventory: { count: 106, parentCount: 358 }, experiments: [] }).status).toBe("noindex");
  });

  it("still enforces inventory, overlap and the CMS override", () => {
    const experiments = [experiment];
    expect(evaluateSeoPage({ key: under100k, inventory: { count: 9, parentCount: 358 }, experiments }).status).toBe("noindex");
    expect(evaluateSeoPage({ key: under100k, inventory: { count: 95, parentCount: 100 }, experiments }).status).toBe("noindex");
    expect(evaluateSeoPage({ key: under100k, inventory: { count: 106, parentCount: 358 }, experiments, editorialNoindex: true }).status).toBe("noindex");
  });

  it("marks a page with evidence but incomplete data as an experiment too", () => {
    const sea: SeoPageKey = { family: "facet", country: "albania", city: "durres", facet: "near-the-sea" };
    const d = evaluateSeoPage({ key: sea, inventory: { count: 98, parentCount: 358 }, experiments: [{ ...experiment, id: "sea", target: sea }] });
    expect(d.status).toBe("experiment");
    expect(d.demand.score).toBe(2);
  });

  it("ships the budget, new-build and sea experiments", () => {
    const ids = (key: SeoPageKey) => evaluateSeoPage({ key, inventory: { count: 50, parentCount: 358 } }).status;
    expect(ids(under100k)).toBe("experiment");
    expect(ids({ family: "facet", country: "albania", city: "durres", facet: "new-builds" })).toBe("experiment");
    expect(ids({ family: "facet", country: "albania", city: "durres", facet: "near-the-sea" })).toBe("experiment");
    expect(ids({ family: "facet", country: "albania", city: "durres", facet: "under-80k" })).toBe("noindex");
  });
});
