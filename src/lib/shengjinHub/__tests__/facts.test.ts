import { describe, expect, it } from "vitest";
import type { PriceIndexCity, PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import {
  budgetBands,
  cheaperByPercent,
  compareRows,
  isBySea,
  layoutRows,
  selectShengjinSeaListings,
  type ShengjinFlatRow,
} from "../facts";

const flat = (over: Partial<ShengjinFlatRow> & { _id: string }): ShengjinFlatRow => ({
  slug: over._id,
  price: 80_000,
  area: 60,
  typeSlug: "apartment",
  bedrooms: 1,
  mainImageUrl: "https://cdn.sanity.io/x.jpg",
  ...over,
});

describe("isBySea", () => {
  it("counts the first line and a stated distance up to the limit, nothing else", () => {
    expect(isBySea(flat({ _id: "a", beachfront: true }))).toBe(true);
    expect(isBySea(flat({ _id: "b", seaDistanceMeters: 1000 }))).toBe(true);
    expect(isBySea(flat({ _id: "c", seaDistanceMeters: 1001 }))).toBe(false);
    expect(isBySea(flat({ _id: "d" }))).toBe(false);
  });
});

describe("selectShengjinSeaListings", () => {
  it("ranks the flats by the sea by €/m², skips those without a photo or a usable price", () => {
    const rows = [
      flat({ _id: "far", price: 30_000, seaDistanceMeters: 3000 }),
      flat({ _id: "dear", price: 120_000, seaDistanceMeters: 100 }),
      flat({ _id: "cheap", price: 60_000, seaDistanceMeters: 100 }),
      flat({ _id: "nophoto", price: 40_000, seaDistanceMeters: 100, mainImageUrl: null }),
      flat({ _id: "persqm", price: 900, priceUnit: "per-sqm", beachfront: true }),
    ];
    expect(selectShengjinSeaListings(rows, 2).map((r) => r._id)).toEqual(["persqm", "cheap"]);
  });
});

describe("budgetBands", () => {
  it("counts flats per ceiling, the open band last, and those by the sea within each", () => {
    const rows = [
      flat({ _id: "a", price: 45_000, beachfront: true }),
      flat({ _id: "b", price: 50_000 }),
      flat({ _id: "c", price: 79_999, seaDistanceMeters: 50 }),
      flat({ _id: "d", price: 99_000 }),
      flat({ _id: "e", price: 150_000, seaDistanceMeters: 50 }),
      flat({ _id: "f", price: 1200, priceUnit: "per-sqm" }),
    ];
    expect(budgetBands(rows, [50_000, 80_000, 100_000])).toEqual([
      { from: 0, to: 50_000, count: 1, bySea: 1 },
      { from: 50_000, to: 80_000, count: 2, bySea: 1 },
      { from: 80_000, to: 100_000, count: 1, bySea: 0 },
      { from: 100_000, to: null, count: 1, bySea: 1 },
    ]);
  });
});

describe("layoutRows", () => {
  it("groups studios, 1+1, 2+1 and 3+1, with a median only over three priced flats", () => {
    const rows = [
      flat({ _id: "s1", typeSlug: "studio", bedrooms: null, price: 40_000 }),
      flat({ _id: "s2", typeSlug: "apartment", bedrooms: 0, price: 42_000 }),
      flat({ _id: "o1", bedrooms: 1, price: 70_000 }),
      flat({ _id: "o2", bedrooms: 1, price: 80_000 }),
      flat({ _id: "o3", bedrooms: 1, price: 95_000 }),
      flat({ _id: "t1", bedrooms: 3, price: 150_000 }),
      flat({ _id: "land", typeSlug: "land", bedrooms: null, price: 20_000 }),
    ];
    expect(layoutRows(rows)).toEqual([
      { key: "studio", count: 2, from: 40_000, median: null },
      { key: "1-1", count: 3, from: 70_000, median: 80_000 },
      { key: "3-1", count: 1, from: 150_000, median: null },
    ]);
  });
});

const figures = (over: Partial<PriceIndexCity>): PriceIndexCity => ({
  slug: "x",
  country: "albania",
  listings: 10,
  flats: 10,
  count: 10,
  median: 1000,
  p20: 900,
  p80: 1100,
  medianFlatPrice: 70_000,
  flatPriceFrom: 40_000,
  reliable: false,
  newBuild: {} as never,
  completed: {} as never,
  districts: [],
  facets: {},
  ...over,
});

describe("compareRows", () => {
  it("keeps the named order, drops a city without a listing and withholds a median under three flats", () => {
    const snapshot: PriceIndexSnapshot = {
      asOf: "2026-10-22",
      computedAt: "2026-10-22T01:00:00Z",
      national: {} as never,
      cities: [
        figures({ slug: "durres", listings: 600, count: 500, median: 1500, reliable: true }),
        figures({ slug: "shengjin", listings: 123, count: 102, median: 1300, reliable: true }),
        figures({ slug: "vlore", listings: 2, count: 2, median: 2400 }),
        figures({ slug: "himare", listings: 0, count: 0, median: null }),
      ],
    };
    const rows = compareRows(snapshot, ["shengjin", "durres", "vlore", "himare", "tirana"]);
    expect(rows.map((r) => [r.slug, r.medianPerSqm, r.reliable])).toEqual([
      ["shengjin", 1300, true],
      ["durres", 1500, true],
      ["vlore", null, false],
    ]);
  });
});

describe("cheaperByPercent", () => {
  it("is a whole per cent when Shëngjin is the cheaper, else null", () => {
    expect(cheaperByPercent(1300, 1500)).toBe(13);
    expect(cheaperByPercent(1500, 1300)).toBeNull();
    expect(cheaperByPercent(null, 1500)).toBeNull();
  });
});
