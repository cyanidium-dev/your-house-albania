import { describe, expect, it } from "vitest";
import { cheapestSeaCity, seaFlatCityRows, seaFlatFigures, type SeaFlatRow } from "../facts";

const flat = (over: Partial<SeaFlatRow> & { _id: string }): SeaFlatRow => ({
  slug: over._id,
  price: 80_000,
  area: 50,
  citySlug: "durres",
  country: "albania",
  mainImageUrl: "https://cdn.sanity.io/x.jpg",
  ...over,
});

describe("seaFlatFigures", () => {
  it("counts, first line, from, median €/m² and median price; medians need three priced flats", () => {
    const rows = [
      flat({ _id: "a", price: 50_000, area: 50, beachfront: true }),
      flat({ _id: "b", price: 100_000, area: 50 }),
      flat({ _id: "c", price: 150_000, area: 100 }),
      flat({ _id: "d", price: 1200, priceUnit: "per-sqm", area: 60 }),
    ];
    expect(seaFlatFigures(rows)).toEqual({ count: 4, beachfront: 1, from: 50_000, medianPerSqm: 1350, medianPrice: 100_000 });
    expect(seaFlatFigures(rows.slice(0, 2)).medianPerSqm).toBeNull();
  });
});

describe("seaFlatCityRows and cheapestSeaCity", () => {
  it("groups by city, most flats first, and names the cheapest city with a median", () => {
    const rows = [
      flat({ _id: "d1", price: 100_000, area: 50 }),
      flat({ _id: "d2", price: 90_000, area: 50 }),
      flat({ _id: "d3", price: 110_000, area: 50 }),
      flat({ _id: "s1", citySlug: "shengjin", price: 60_000, area: 50 }),
      flat({ _id: "s2", citySlug: "shengjin", price: 65_000, area: 50 }),
      flat({ _id: "s3", citySlug: "shengjin", price: 70_000, area: 50 }),
      flat({ _id: "s4", citySlug: "shengjin", price: 75_000, area: 50, beachfront: true }),
      flat({ _id: "v1", citySlug: "vlore", price: 200_000, area: 80 }),
      flat({ _id: "x", citySlug: "nowhere", country: null, price: 10_000 }),
    ];
    const cities = seaFlatCityRows(rows);
    expect(cities.map((c) => [c.citySlug, c.count, c.beachfront, c.from, c.medianPerSqm])).toEqual([
      ["shengjin", 4, 1, 60_000, 1350],
      ["durres", 3, 0, 90_000, 2000],
      ["vlore", 1, 0, 200_000, null],
    ]);
    expect(cheapestSeaCity(cities)?.citySlug).toBe("shengjin");
    expect(cheapestSeaCity([])).toBeNull();
  });
});
