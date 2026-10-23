import { describe, expect, it } from "vitest";
import { districtHouseRows, isHouseBySea, seaHouseFigures, selectSeaHouses, type HouseRow } from "../facts";

const house = (over: Partial<HouseRow> & { _id: string }): HouseRow => ({
  slug: over._id,
  price: 200_000,
  area: 200,
  citySlug: "durres",
  districtSlug: "plazh",
  mainImageUrl: "https://cdn.sanity.io/x.jpg",
  ...over,
});

describe("isHouseBySea", () => {
  it("counts the first line and a stated distance up to 1 km", () => {
    expect(isHouseBySea(house({ _id: "a", beachfront: true }))).toBe(true);
    expect(isHouseBySea(house({ _id: "b", seaDistanceMeters: 1000 }))).toBe(true);
    expect(isHouseBySea(house({ _id: "c", seaDistanceMeters: 1150 }))).toBe(false);
    expect(isHouseBySea(house({ _id: "d" }))).toBe(false);
  });
});

describe("seaHouseFigures", () => {
  it("counts the houses by the sea, the first line, from and median, and the total of every house", () => {
    const rows = [
      house({ _id: "a", price: 100_000, beachfront: true }),
      house({ _id: "b", price: 300_000, seaDistanceMeters: 300 }),
      house({ _id: "c", price: 250_000, seaDistanceMeters: 900 }),
      house({ _id: "far", price: 45_000, seaDistanceMeters: 6000 }),
      house({ _id: "persqm", price: 1200, priceUnit: "per-sqm", beachfront: true }),
    ];
    expect(seaHouseFigures(rows)).toEqual({ count: 4, beachfront: 2, from: 100_000, median: 250_000, total: 5, totalFrom: 45_000 });
  });

  it("withholds the median under three priced houses", () => {
    expect(seaHouseFigures([house({ _id: "a", beachfront: true }), house({ _id: "b", beachfront: true })]).median).toBeNull();
  });
});

describe("selectSeaHouses", () => {
  it("takes the houses by the sea cheapest first, skipping those without a price or a photo", () => {
    const rows = [
      house({ _id: "dear", price: 500_000, beachfront: true }),
      house({ _id: "cheap", price: 120_000, seaDistanceMeters: 200 }),
      house({ _id: "nophoto", price: 90_000, beachfront: true, mainImageUrl: null }),
      house({ _id: "far", price: 50_000, seaDistanceMeters: 3000 }),
    ];
    expect(selectSeaHouses(rows, 5).map((r) => r._id)).toEqual(["cheap", "dear"]);
  });
});

describe("districtHouseRows", () => {
  it("groups by district, folds single houses into the city's other row, which comes last", () => {
    const rows = [
      house({ _id: "p1", districtSlug: "plazh", price: 200_000, beachfront: true }),
      house({ _id: "p2", districtSlug: "plazh", price: 300_000, seaDistanceMeters: 100 }),
      house({ _id: "p3", districtSlug: "plazh", price: 400_000, seaDistanceMeters: 100 }),
      house({ _id: "g1", districtSlug: "golem-durres", price: 280_000, seaDistanceMeters: 50 }),
      house({ _id: "g2", districtSlug: "golem-durres", price: 350_000, seaDistanceMeters: 50 }),
      house({ _id: "q1", districtSlug: "qerret", price: 320_000, seaDistanceMeters: 500 }),
      house({ _id: "n1", districtSlug: null, price: 195_000, seaDistanceMeters: 500 }),
      house({ _id: "far", districtSlug: "plazh", price: 1_000, seaDistanceMeters: 5000 }),
    ];
    const out = districtHouseRows(rows, 2);
    expect(out.map((r) => [r.districtSlug, r.count, r.from, r.median, r.beachfront])).toEqual([
      ["plazh", 3, 200_000, 300_000, 1],
      ["golem-durres", 2, 280_000, null, 0],
      [null, 2, 195_000, null, 0],
    ]);
  });
});
