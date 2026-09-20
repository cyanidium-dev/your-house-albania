import { describe, expect, it } from "vitest";
import { groupRowsBy, median, pricesPerSqm, summarizeFlatPrices, totalPrices } from "../listingPriceSummary";

describe("median", () => {
  it("is null without values, the middle value, or the rounded mean of the two middle ones", () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(3);
    expect(median([100, 101])).toBe(101);
  });
});

describe("totalPrices / pricesPerSqm", () => {
  const rows = [
    { price: 100000, priceUnit: "total", area: 50 },
    { price: 1300, priceUnit: "per-sqm", area: 80 },
    { price: 90000, area: 10 },
    { price: 0, area: 60 },
    { price: null, area: 60 },
  ];

  it("keeps per-m² rates out of the totals", () => {
    expect(totalPrices(rows)).toEqual([100000, 90000]);
  });

  it("takes the stated rate, divides a total by a plausible area, and skips the rest", () => {
    expect(pricesPerSqm(rows)).toEqual([2000, 1300]);
  });
});

describe("summarizeFlatPrices", () => {
  it("counts every listing but prices flats and studios only", () => {
    const summary = summarizeFlatPrices([
      { price: 80000, area: 40, type: "apartment" },
      { price: 60000, area: 30, type: "studio" },
      { price: 100000, area: 50, type: "apartment" },
      { price: 900000, area: 3000, type: "land" },
      { price: 400000, area: 200, type: "villa" },
    ]);
    expect(summary).toEqual({
      count: 5,
      flatCount: 3,
      flatPriceFrom: 60000,
      medianFlatPrice: 80000,
      medianFlatPricePerSqm: 2000,
    });
  });

  it("prints nothing it cannot compute", () => {
    expect(summarizeFlatPrices([{ price: 5000, area: 900, type: "land" }])).toEqual({
      count: 1,
      flatCount: 0,
      flatPriceFrom: null,
      medianFlatPrice: null,
      medianFlatPricePerSqm: null,
    });
  });
});

describe("groupRowsBy", () => {
  it("groups in first-seen order and skips rows without a key", () => {
    const grouped = groupRowsBy([{ c: "durres" }, { c: null }, { c: "vlore" }, { c: "durres" }], (r) => r.c);
    expect([...grouped.keys()]).toEqual(["durres", "vlore"]);
    expect(grouped.get("durres")).toHaveLength(2);
  });
});
