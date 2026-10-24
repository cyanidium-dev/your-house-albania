import { describe, expect, it } from "vitest";
import type { PriceIndexCity, PriceIndexFigures, PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { bestYieldCity, cheapestReliableCity, investmentCityRow, investmentCityRows } from "../facts";

const fig = (over: Partial<PriceIndexFigures> = {}): PriceIndexFigures => ({
  listings: 0,
  flats: 0,
  count: 0,
  median: null,
  p20: null,
  p80: null,
  medianFlatPrice: null,
  flatPriceFrom: null,
  reliable: false,
  ...over,
});

const city = (slug: string, over: Partial<PriceIndexCity> = {}): PriceIndexCity => ({
  slug,
  country: "albania",
  ...fig({ listings: 100, flats: 90, count: 80, median: 1500, medianFlatPrice: 110_000, flatPriceFrom: 40_000, reliable: true }),
  newBuild: fig({ count: 20, median: 1700 }),
  completed: fig({ count: 60, median: 1400 }),
  districts: [],
  facets: {},
  ...over,
});

describe("investmentCityRow", () => {
  it("prices the 1+1 from the facet when it has a sample, and yields it against the data-sheet rent", () => {
    const row = investmentCityRow(city("durres", { facets: { "1-1": fig({ count: 40, medianFlatPrice: 90_000 }) } }));
    expect(row.oneBedIsFacet).toBe(true);
    expect(row.oneBedPrice).toBe(90_000);
    expect(row.rent).toEqual({ min: 250, max: 400 });
    // 250 × 12 / 90 000 = 3.3 %, 400 × 12 / 90 000 = 5.3 %
    expect(row.grossYield).toEqual({ min: 3.3, max: 5.3 });
    expect(row.netYield!.min).toBeLessThan(row.grossYield!.min);
    expect(row.newBuildPerSqm).toBe(1700);
    expect(row.completedPerSqm).toBe(1400);
  });

  it("falls back to the flats median without a 1+1 sample, and has no yield without a rent", () => {
    const row = investmentCityRow(city("shkoder", { facets: { "1-1": fig({ count: 2, medianFlatPrice: 70_000 }) } }));
    expect(row.oneBedIsFacet).toBe(false);
    expect(row.oneBedPrice).toBe(110_000);
    expect(row.rent).toBeNull();
    expect(row.grossYield).toBeNull();
  });

  it("withholds medians under three flats", () => {
    const row = investmentCityRow(city("himare", { count: 2, median: 2400, newBuild: fig({ count: 1, median: 2500 }), completed: fig({ count: 1, median: 2300 }) }));
    expect(row.medianPerSqm).toBeNull();
    expect(row.newBuildPerSqm).toBeNull();
    expect(row.completedPerSqm).toBeNull();
  });
});

describe("investmentCityRows, bestYieldCity, cheapestReliableCity", () => {
  it("keeps the lead order, appends the rest with a sample by listings, and picks the best yield and the cheapest reliable city", () => {
    const snapshot: PriceIndexSnapshot = {
      asOf: "2026-10-24",
      computedAt: "2026-10-24T01:00:00Z",
      national: fig(),
      cities: [
        city("tirana", { listings: 16, count: 10, median: 2248, reliable: false, facets: { "1-1": fig({ count: 5, medianFlatPrice: 150_000 }) } }),
        city("shengjin", { listings: 123, count: 102, median: 1300, facets: { "1-1": fig({ count: 60, medianFlatPrice: 86_000 }) } }),
        city("durres", { listings: 666, count: 511, median: 1500, facets: { "1-1": fig({ count: 200, medianFlatPrice: 95_000 }) } }),
        city("shkoder", { listings: 1, count: 1, median: 2500, reliable: false }),
        city("nowhere", { listings: 0 }),
      ],
    };
    const rows = investmentCityRows(snapshot, ["durres", "shengjin", "tirana"]);
    expect(rows.map((r) => r.slug)).toEqual(["durres", "shengjin", "tirana"]);
    expect(bestYieldCity(rows)?.slug).toBe("shengjin");
    expect(cheapestReliableCity(rows)?.slug).toBe("shengjin");
    expect(bestYieldCity([])).toBeNull();
  });
});
