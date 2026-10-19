import { describe, expect, it } from "vitest";
import {
  blogPostTopics,
  guideTopics,
  inferTopicsFromSlug,
  largestCity,
  pickInventoryCards,
  planInventoryLinks,
  resolveCatalogTargets,
  topicKey,
  type PlaceDirectory,
  type PlaceTopic,
} from "./places";
import { isListingTopicIndexable } from "./indexing";
import type { SeoPageDecisionRow } from "@/lib/sanity/queries/seoPages";

const dir: PlaceDirectory = {
  cities: ["durres", "tirana", "vlore", "sarande", "shengjin", "himare", "shkoder"],
  districtCity: {
    plazh: "durres",
    "golem-durres": "durres",
    "mali-i-robit": "durres",
    "city-center-durres": "durres",
    blloku: "tirana",
    "myslym-shyri": "tirana",
    ksamil: "sarande",
    lungomare: "vlore",
    dhermi: "himare",
    velipoja: "shkoder",
  },
};

describe("blogPostTopics", () => {
  it("uses the reviewed map first", () => {
    expect(blogPostTopics("durres-beach-vs-center", dir)).toEqual([
      { city: "durres", district: "plazh" },
      { city: "durres", district: "city-center-durres" },
    ]);
  });

  it("keeps a post mapped to [] national, even when its slug names nothing", () => {
    expect(blogPostTopics("legal-guide-buyers", dir)).toEqual([]);
  });

  it("covers every post in the map that names a city with a city the site has", () => {
    expect(blogPostTopics("saranda-apartment-prices-districts-2026", dir)).toEqual([{ city: "sarande" }]);
  });

  it("falls back to the slug for a post with no line", () => {
    expect(blogPostTopics("vlora-seafront-flats-2027", dir)).toEqual([{ city: "vlore" }]);
  });

  it("drops a mapped city the directory does not know", () => {
    expect(blogPostTopics("best-districts-tirana", { ...dir, cities: ["durres"] })).toEqual([]);
  });
});

describe("inferTopicsFromSlug", () => {
  it("reads English spellings of Albanian city slugs", () => {
    expect(inferTopicsFromSlug("saranda-vs-tirane-rents", dir)).toEqual([{ city: "sarande" }, { city: "tirana" }]);
  });

  it("matches multi-token district slugs, longest first", () => {
    expect(inferTopicsFromSlug("golem-durres-vs-mali-i-robit", dir)).toEqual([
      { city: "durres", district: "golem-durres" },
      { city: "durres", district: "mali-i-robit" },
    ]);
  });

  it("finds nothing in a slug about Albania as a whole", () => {
    expect(inferTopicsFromSlug("notary-fees-albania-2026", dir)).toEqual([]);
  });
});

describe("guideTopics", () => {
  it("reads city: and zone: tags, folding the duplicate city", () => {
    expect(guideTopics(["city:durres", "zone:durres", "theme:buying"], dir)).toEqual([{ city: "durres" }]);
  });

  it("puts a district zone under its city", () => {
    expect(guideTopics(["theme:market", "zone:golem-durres", "zone:plazh"], dir)).toEqual([
      { city: "durres", district: "golem-durres" },
      { city: "durres", district: "plazh" },
    ]);
  });

  it("drops foreign zones", () => {
    expect(guideTopics(["zone:tirana", "zone:croatia"], dir)).toEqual([{ city: "tirana" }]);
  });

  it("is empty for theme-only tags and for non-arrays", () => {
    expect(guideTopics(["theme:market"], dir)).toEqual([]);
    expect(guideTopics(undefined, dir)).toEqual([]);
  });
});

describe("planInventoryLinks", () => {
  it("one city: its price index, cards from its district first, then the city", () => {
    const plan = planInventoryLinks(
      [
        { city: "durres", district: "plazh" },
        { city: "durres", district: "city-center-durres" },
      ],
      { fallbackCity: "durres" }
    );
    expect(plan.kind).toBe("city");
    expect(plan.indexCities).toEqual(["durres"]);
    expect(plan.cardSources.map(topicKey)).toEqual(["durres|plazh|", "durres|city-center-durres|", "durres||"]);
  });

  it("several cities: at most three indexes, cards from the first city before the others", () => {
    const plan = planInventoryLinks(
      [{ city: "tirana" }, { city: "durres" }, { city: "vlore" }, { city: "sarande" }],
      { fallbackCity: "durres" }
    );
    expect(plan.kind).toBe("cities");
    expect(plan.indexCities).toEqual(["tirana", "durres", "vlore"]);
    expect(plan.cardSources[0]).toEqual({ city: "tirana" });
  });

  it("a typed topic feeds the cards before the whole city", () => {
    const plan = planInventoryLinks([{ city: "durres", type: "apartment" }, { city: "durres" }], {
      fallbackCity: "durres",
    });
    expect(plan.cardSources).toEqual([{ city: "durres", type: "apartment" }, { city: "durres" }]);
  });

  it("no city: national index, cards and a link from the largest city", () => {
    const plan = planInventoryLinks([], { fallbackCity: "durres" });
    expect(plan).toEqual({
      kind: "national",
      indexCities: [],
      cardSources: [{ city: "durres" }],
      catalogTopics: [{ city: "durres" }],
    });
  });
});

describe("resolveCatalogTargets", () => {
  const indexed = new Set(["durres||", "durres|plazh|", "durres||studio", "sarande||"]);
  const isIndexable = (t: PlaceTopic) => indexed.has(topicKey(t));

  it("links an indexed district or typed page as itself", () => {
    expect(resolveCatalogTargets([{ city: "durres", district: "plazh" }, { city: "durres", type: "studio" }], isIndexable)).toEqual([
      { city: "durres", district: "plazh" },
      { city: "durres", type: "studio" },
    ]);
  });

  it("falls back to the city page once, and skips a city not indexed in this locale", () => {
    expect(
      resolveCatalogTargets(
        [
          { city: "durres", district: "plepa-durres" },
          { city: "durres", type: "apartment" },
          { city: "tirana" },
        ],
        isIndexable
      )
    ).toEqual([{ city: "durres" }]);
  });
});

describe("pickInventoryCards", () => {
  const card = (slug: string, photo = true) => ({ slug, images: photo ? [{ src: `${slug}.jpg` }] : [] });

  it("takes sources in order, photos first, no duplicates or excluded listings", () => {
    const picked = pickInventoryCards(
      [
        [card("a", false), card("b"), card("x")],
        [card("b"), card("c"), card("d")],
      ],
      { exclude: ["x"] }
    );
    expect(picked.map((c) => c.slug)).toEqual(["b", "c", "d"]);
  });

  it("uses a listing without a photo only to fill the row", () => {
    const picked = pickInventoryCards([[card("a", false), card("b")]]);
    expect(picked.map((c) => c.slug)).toEqual(["b", "a"]);
  });
});

describe("largestCity", () => {
  it("is the city with the most listings, Durrës when there is no data", () => {
    expect(largestCity([{ city: "tirana", count: 17 }, { city: "durres", count: 666 }])).toBe("durres");
    expect(largestCity([])).toBe("durres");
  });
});

describe("isListingTopicIndexable", () => {
  const row = (key: object, locales: string[]): SeoPageDecisionRow =>
    ({
      decision: { key, status: locales.length ? "index" : "noindex", indexableLocales: locales },
      count: 10,
    }) as unknown as SeoPageDecisionRow;
  const rows = [
    row({ family: "city", country: "albania", city: "tirana" }, ["en", "sq", "de"]),
    row({ family: "district", country: "albania", city: "durres", district: "plazh" }, ["en", "ru"]),
    row({ family: "cityType", country: "albania", city: "durres", type: "studio" }, ["en"]),
  ];

  it("follows the registry per locale", () => {
    expect(isListingTopicIndexable(rows, { country: "albania", city: "tirana" }, "en")).toBe(true);
    expect(isListingTopicIndexable(rows, { country: "albania", city: "tirana" }, "ru")).toBe(false);
    expect(isListingTopicIndexable(rows, { country: "albania", city: "durres", district: "plazh" }, "ru")).toBe(true);
    expect(isListingTopicIndexable(rows, { country: "albania", city: "durres", type: "studio" }, "en")).toBe(true);
  });

  it("is false without decisions or for a page the registry has no row for", () => {
    expect(isListingTopicIndexable(null, { country: "albania", city: "tirana" }, "en")).toBe(false);
    expect(isListingTopicIndexable(rows, { country: "albania", city: "vlore" }, "en")).toBe(false);
  });
});
