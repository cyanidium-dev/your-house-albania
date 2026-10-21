import { describe, expect, it } from "vitest";
import { buildPriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { cityMedianMap, hubCityRows, hubLeadCities, listingPricePerSqm, selectSeaListings } from "../facts";

const flat = (slug: string, city: string, price: number, area: number | null, extra: Record<string, unknown> = {}) => ({
  slug,
  citySlug: city,
  price,
  priceUnit: "total",
  area,
  mainImageUrl: "https://cdn.sanity.io/x.jpg",
  ...extra,
});

describe("listingPricePerSqm", () => {
  it("divides a total price by a plausible area and keeps a per-m² rate as is", () => {
    expect(listingPricePerSqm(flat("a", "durres", 100_000, 50))).toBe(2000);
    expect(listingPricePerSqm(flat("b", "durres", 1500, 50, { priceUnit: "per-sqm" }))).toBe(1500);
  });
  it("has no figure for a missing price or an implausible area", () => {
    expect(listingPricePerSqm(flat("a", "durres", 0, 50))).toBeNull();
    expect(listingPricePerSqm(flat("a", "durres", 100_000, 10))).toBeNull();
  });
});

describe("selectSeaListings", () => {
  const medians = new Map([
    ["durres", 1500],
    ["vlore", 2000],
  ]);

  it("ranks by €/m² against the city median, cheapest first", () => {
    const rows = [
      flat("d-dear", "durres", 100_000, 50), // 2000 → 1.33
      flat("v-cheap", "vlore", 60_000, 50), // 1200 → 0.6
      flat("d-cheap", "durres", 50_000, 50), // 1000 → 0.67
    ];
    expect(selectSeaListings(rows, medians).map((r) => r.slug)).toEqual(["v-cheap", "d-cheap", "d-dear"]);
  });

  it("caps one city while others still have candidates, then fills from the rest", () => {
    const rows = [
      ...Array.from({ length: 6 }, (_, i) => flat(`d${i}`, "durres", 40_000 + i * 1000, 50)),
      flat("v0", "vlore", 150_000, 50), // 3000 → 1.5, worst ratio
    ];
    const picked = selectSeaListings(rows, medians, 5, 2).map((r) => r.slug);
    expect(picked.slice(0, 3)).toEqual(["d0", "d1", "v0"]);
    expect(picked).toHaveLength(5);
    expect(picked.slice(3)).toEqual(["d2", "d3"]);
  });

  it("skips listings with no photo or no €/m², and sorts a city without a median last", () => {
    const rows = [
      flat("no-photo", "durres", 40_000, 50, { mainImageUrl: null }),
      flat("no-area", "durres", 40_000, null),
      flat("unknown-city", "himare", 30_000, 50), // 600 €/m², but no median
      flat("d", "durres", 90_000, 50), // 1800 → 1.2
    ];
    expect(selectSeaListings(rows, medians).map((r) => r.slug)).toEqual(["d", "unknown-city"]);
  });
});

describe("hubCityRows", () => {
  const snapshot = buildPriceIndexSnapshot({
    rows: [
      ...Array.from({ length: 4 }, (_, i) => ({ price: 60_000 + i * 5000, area: 50, type: "apartment", c: "durres" })),
      ...Array.from({ length: 2 }, () => ({ price: 100_000, area: 50, type: "apartment", c: "tirana" })),
      { price: 200_000, area: 100, type: "house", c: "shengjin" },
    ],
    cities: [
      { slug: "durres", country: "albania" },
      { slug: "tirana", country: "albania" },
      { slug: "shengjin", country: "albania" },
      { slug: "himare", country: "albania" },
    ],
    districts: [],
    computedAt: "2026-10-20T10:00:00.000Z",
  });

  it("puts the lead cities first in their order, then the rest by listings; no city without a listing", () => {
    const rows = hubCityRows(snapshot, ["durres", "tirana", "vlore", "sarande"]);
    expect(rows.map((r) => r.slug)).toEqual(["durres", "tirana", "shengjin"]);
  });

  it("prints a median over three flats and withholds it under that", () => {
    const rows = hubCityRows(snapshot, ["durres", "tirana"]);
    expect(rows[0].medianPerSqm).toBe(1350);
    expect(rows[0].reliable).toBe(false);
    expect(rows[1].medianPerSqm).toBeNull();
    expect(rows[1].flatPriceFrom).toBe(100_000);
    expect(hubLeadCities(rows, ["durres", "tirana"]).map((r) => r.slug)).toEqual(["durres"]);
    expect([...cityMedianMap(rows).entries()]).toEqual([["durres", 1350]]);
  });
});
