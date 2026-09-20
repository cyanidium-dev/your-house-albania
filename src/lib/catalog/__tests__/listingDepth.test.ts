import { describe, expect, it } from "vitest";
import { decideSeoPages, type SeoDecisionSourceRows } from "@/lib/seo/pages";
import {
  LISTING_FAQ_MAX,
  MIN_STAT_LISTINGS,
  districtLinkTargets,
  pickListingFaq,
  placePriceFacts,
  placeSliceCounts,
  type PlacePriceIndexRow,
} from "../listingDepth";

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

const rows = decideSeoPages(
  {
    cities: [{ citySlug: "durres", countrySlug: "albania" }],
    districts: [
      { citySlug: "durres", districtSlug: "golem-durres" },
      { citySlug: "durres", districtSlug: "plazh" },
      { citySlug: "durres", districtSlug: "spille" },
    ],
    catalogNoIndex: [],
    properties: [
      ...repeat(40, (i) => flat("golem-durres", (i % 2) + 1)),
      ...repeat(35, (i) => flat("plazh", (i % 2) + 1, { beachfront: i < 20 })),
      ...repeat(12, () => flat("spille", 3)),
      ...repeat(2, () => flat(undefined, 1, { constructionStage: "off-plan" })),
    ],
  },
  undefined,
  [],
);
const durres = { country: "albania", city: "durres" };

describe("placePriceFacts", () => {
  const index: PlacePriceIndexRow[] = [
    { districtSlug: null, count: 120, flatCount: 100, flatPriceFrom: 40000, medianFlatPrice: 95000, medianFlatPricePerSqm: 1400 },
    { districtSlug: "golem-durres", count: 40, flatCount: 38, flatPriceFrom: 45000, medianFlatPrice: 88000, medianFlatPricePerSqm: 1300 },
    { districtSlug: "spille", count: 12, flatCount: 2, flatPriceFrom: 70000, medianFlatPrice: 75000, medianFlatPricePerSqm: 1100 },
    { districtSlug: "arapaj", count: 2, flatCount: 2, flatPriceFrom: 60000, medianFlatPrice: 61000, medianFlatPricePerSqm: 900 },
  ];

  it("returns the city row without a district and the district's row with one", () => {
    expect(placePriceFacts(index)?.medianFlatPrice).toBe(95000);
    expect(placePriceFacts(index, "Golem-Durres")?.medianFlatPricePerSqm).toBe(1300);
  });

  it("prints no median over fewer than the minimum of flats", () => {
    const spille = placePriceFacts(index, "spille");
    expect(spille).toMatchObject({ count: 12, medianFlatPrice: null, medianFlatPricePerSqm: null, flatPriceFrom: 70000 });
  });

  it("says nothing about a place with too few listings, or an unknown one", () => {
    expect(index[3].count).toBeLessThan(MIN_STAT_LISTINGS);
    expect(placePriceFacts(index, "arapaj")).toBeNull();
    expect(placePriceFacts(index, "nowhere")).toBeNull();
    expect(placePriceFacts([])).toBeNull();
  });
});

describe("placeSliceCounts", () => {
  it("counts a city's room, sea and new-build slices in facet order and links only indexable ones", () => {
    const slices = placeSliceCounts({ rows, place: durres, locale: "en" });
    expect(slices.map((s) => s.facet)).toEqual(["near-the-sea", "1-1", "2-1", "3-1"]);
    expect(slices.find((s) => s.facet === "1-1")).toMatchObject({ linkable: true });
    // 3+1 has stock but no keyword evidence: a count, never a link.
    expect(slices.find((s) => s.facet === "3-1")).toMatchObject({ count: 12, linkable: false });
  });

  it("leaves out budgets and slices under the minimum", () => {
    const slices = placeSliceCounts({ rows, place: durres, locale: "en" });
    expect(slices.some((s) => s.facet === "under-100k" || s.facet === "under-80k")).toBe(false);
    // Two off-plan listings: not a number worth printing.
    expect(slices.some((s) => s.facet === "new-builds")).toBe(false);
  });

  it("keeps a district's slices apart from the city's", () => {
    const slices = placeSliceCounts({ rows, place: { ...durres, district: "plazh" }, locale: "en" });
    expect(slices.find((s) => s.facet === "near-the-sea")?.count).toBe(20);
    expect(slices.every((s) => !s.linkable)).toBe(true);
  });
});

describe("districtLinkTargets", () => {
  it("links a city to its indexable districts, largest first", () => {
    expect(districtLinkTargets({ rows, place: durres, locale: "en" })).toEqual([
      { district: "golem-durres", count: 40 },
      { district: "plazh", count: 35 },
    ]);
  });

  it("links a district to its siblings and never to itself", () => {
    expect(districtLinkTargets({ rows, place: { ...durres, district: "plazh" }, locale: "en" })).toEqual([
      { district: "golem-durres", count: 40 },
    ]);
  });
});

describe("pickListingFaq", () => {
  const items = Array.from({ length: 11 }, (_, i) => `q${i}`);

  it("shows a city a short run that starts after the price question", () => {
    const { shown, hasMore } = pickListingFaq(items, "city");
    expect(shown).toEqual(["q1", "q2", "q3", "q4", "q5"]);
    expect(shown.length).toBe(LISTING_FAQ_MAX.city);
    expect(hasMore).toBe(true);
  });

  it("shows a short city list whole", () => {
    expect(pickListingFaq(["a", "b", "c", "d"], "city")).toEqual({ shown: ["a", "b", "c", "d"], hasMore: false });
  });

  it("shows a district all of its questions", () => {
    expect(pickListingFaq(["a", "b", "c"], "district")).toEqual({ shown: ["a", "b", "c"], hasMore: false });
  });
});
