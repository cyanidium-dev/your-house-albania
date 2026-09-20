import { describe, expect, it } from "vitest";
import { decideSeoPages, type SeoDecisionSourceRows } from "@/lib/seo/pages";
import { LISTING_DEAL_TYPE_NOINDEX_THRESHOLD } from "@/lib/seo/listingIndexPolicy";
import { MIN_STAT_LISTINGS } from "../listingDepth";
import { HUB_DISTRICTS_PER_CITY, hubCities, hubCityDistricts, hubTypes, type HubCityPriceRow } from "../saleHubDepth";

type Property = NonNullable<SeoDecisionSourceRows["properties"]>[number];
const flat = (citySlug: string, districtSlug?: string): Property => ({
  citySlug,
  districtSlug,
  deal: "sale",
  typeSlug: "apartment",
  bedrooms: 1,
  price: 90000,
  priceUnit: "total",
  _updatedAt: "2026-09-01T00:00:00Z",
});
const repeat = <T,>(n: number, make: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => make(i));

const durresDistricts = repeat(10, (i) => `d${i}`);
const rows = decideSeoPages(
  {
    cities: [
      { citySlug: "durres", countrySlug: "albania" },
      { citySlug: "vlore", countrySlug: "albania" },
      { citySlug: "shengjin", countrySlug: "albania" },
    ],
    districts: durresDistricts.map((districtSlug) => ({ citySlug: "durres", districtSlug })),
    catalogNoIndex: [],
    properties: [
      ...durresDistricts.flatMap((d, i) => repeat(40 - i, () => flat("durres", d))),
      ...repeat(4, () => flat("vlore")),
      ...repeat(2, () => flat("shengjin")),
    ],
  },
  undefined,
  [],
);

const price = (citySlug: string, count: number, flatCount: number): HubCityPriceRow => ({
  citySlug,
  count,
  flatCount,
  flatPriceFrom: flatCount ? 50000 : null,
  medianFlatPrice: flatCount ? 90000 : null,
  medianFlatPricePerSqm: flatCount ? 1400 : null,
});

describe("hubCities", () => {
  const cities = hubCities({
    cities: [price("vlore", 4, 2), price("Durres", 355, 300), price("shengjin", 2, 2), price("ghost", 9, 9)],
    rows,
    locale: "en",
  });

  it("drops a city with too few listings and orders the rest by size", () => {
    expect(MIN_STAT_LISTINGS).toBe(3);
    expect(cities.map((c) => c.citySlug)).toEqual(["durres", "ghost", "vlore"]);
  });

  it("links a city only when the registry indexes its page in this locale", () => {
    expect(cities.find((c) => c.citySlug === "durres")).toMatchObject({
      countrySlug: "albania",
      linkable: true,
      inPriceTable: true,
      medianFlatPrice: 90000,
    });
    // Four listings: below the registry's inventory floor, so text only.
    expect(cities.find((c) => c.citySlug === "vlore")).toMatchObject({ countrySlug: "albania", linkable: false });
    // In the price index but unknown to the registry: shown, never linked.
    expect(cities.find((c) => c.citySlug === "ghost")).toMatchObject({ countrySlug: null, linkable: false });
  });

  it("keeps a city with too few flats out of the price table and blanks its medians", () => {
    expect(cities.find((c) => c.citySlug === "vlore")).toMatchObject({
      inPriceTable: false,
      medianFlatPrice: null,
      medianFlatPricePerSqm: null,
    });
  });

  it("links nothing when the registry could not be read", () => {
    expect(hubCities({ cities: [price("durres", 355, 300)], rows: [], locale: "en" })[0]).toMatchObject({
      countrySlug: null,
      linkable: false,
    });
  });
});

describe("hubCityDistricts", () => {
  it("lists the largest indexable districts of linkable cities, capped", () => {
    const cities = hubCities({ cities: [price("durres", 355, 300), price("vlore", 4, 3)], rows, locale: "en" });
    const out = hubCityDistricts({ cities, rows, locale: "en" });
    expect(out.map((c) => c.citySlug)).toEqual(["durres"]);
    expect(out[0].districts).toHaveLength(HUB_DISTRICTS_PER_CITY);
    expect(out[0].districts[0]).toEqual({ district: "d0", count: 40 });
  });
});

describe("hubTypes", () => {
  const types = [
    { typeSlug: "office", count: 1 },
    { typeSlug: "villa", count: LISTING_DEAL_TYPE_NOINDEX_THRESHOLD },
    { typeSlug: "apartment", count: 257 },
    { typeSlug: "land", count: LISTING_DEAL_TYPE_NOINDEX_THRESHOLD + 1 },
  ];

  it("drops thin types, orders by size, links only indexed type pages", () => {
    expect(hubTypes({ types, hubNoindex: false })).toEqual([
      { typeSlug: "apartment", count: 257, linkable: true },
      { typeSlug: "land", count: LISTING_DEAL_TYPE_NOINDEX_THRESHOLD + 1, linkable: true },
      { typeSlug: "villa", count: LISTING_DEAL_TYPE_NOINDEX_THRESHOLD, linkable: false },
    ]);
  });

  it("links no type page while the CMS noindexes the national catalogue", () => {
    expect(hubTypes({ types, hubNoindex: true }).every((t) => !t.linkable)).toBe(true);
  });
});
