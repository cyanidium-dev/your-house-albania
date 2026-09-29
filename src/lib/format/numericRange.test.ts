import { describe, expect, it } from "vitest";
import { parseNumericRange, rangePosition, rangeScale } from "./numericRange";

describe("parseNumericRange", () => {
  it("reads ranges in every locale's separators", () => {
    expect(parseNumericRange("1,900–2,800")).toEqual([1900, 2800]);
    expect(parseNumericRange("1.900–2.800")).toEqual([1900, 2800]);
    expect(parseNumericRange("1\u202f900–2\u202f800")).toEqual([1900, 2800]);
    expect(parseNumericRange("1900-2800")).toEqual([1900, 2800]);
    expect(parseNumericRange("1,110")).toEqual([1110, 1110]);
    expect(parseNumericRange("228,400")).toEqual([228400, 228400]);
    expect(parseNumericRange("€1,300/m²")).toEqual([1300, 1300]);
  });

  it("refuses what is not a whole-number price", () => {
    expect(parseNumericRange("—")).toBeNull();
    expect(parseNumericRange("5.5")).toBeNull();
    expect(parseNumericRange("7–11%")).toBeNull();
    expect(parseNumericRange("€1.5–3m")).toBeNull();
    expect(parseNumericRange("Sourced zone by zone")).toBeNull();
    expect(parseNumericRange(undefined)).toBeNull();
  });
});

describe("rangeScale / rangePosition", () => {
  it("needs two numbers that differ", () => {
    expect(rangeScale([[1000, 1500], null])).toBeNull();
    expect(rangeScale([[1000, 1000], [1000, 1000]])).toBeNull();
    expect(rangeScale([[1000, 1500], [1200, 2000]])).toEqual({ lo: 1000, hi: 2000 });
  });

  it("places a range on the scale", () => {
    const scale = { lo: 1000, hi: 2000 };
    expect(rangePosition([1000, 1500], scale)).toEqual({ left: 0, width: 50 });
    expect(rangePosition([1500, 1500], scale)).toEqual({ left: 50, width: 0 });
  });
});
