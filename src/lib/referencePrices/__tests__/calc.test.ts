import { describe, it, expect } from "vitest";
import { computeReference } from "../calc";
import { ALL_REFERENCE_PLACES, OUTSIDE_TIRANA, TIRANA_ZONES, TIRANA_UNITS } from "../data";

describe("computeReference", () => {
  it("reproduces the ASHK worked example (Tirana zone 2/4, 75 m², title from 2004)", () => {
    // Instruction 34/2023: 75 × (120,300 − 19% × 120,300) = 7,308,225 lekë.
    const r = computeReference({ pricePerSqm: 120_300, sqm: 75, years: 19, contractPrice: 0, purchasePrice: 0 });
    expect(r.referenceValue).toBe(7_308_225);
    expect(r.referenceApplies).toBe(true);
  });

  it("caps depreciation at 30%", () => {
    const r = computeReference({ pricePerSqm: 67_500, sqm: 60, years: 45, contractPrice: 0, purchasePrice: 0 });
    expect(r.depreciation).toBe(0.3);
    expect(r.referenceValue).toBe(Math.round(60 * 67_500 * 0.7));
  });

  it("taxes the gain on the higher of contract and reference value", () => {
    // Durrës, 60 m², new: reference 4,050,000; contract above it decides.
    const r = computeReference({ pricePerSqm: 67_500, sqm: 60, years: 0, contractPrice: 9_000_000, purchasePrice: 7_000_000 });
    expect(r.referenceApplies).toBe(false);
    expect(r.deemedSaleValue).toBe(9_000_000);
    expect(r.capitalGainsTax).toBe(300_000);
    expect(r.revaluationTax).toBe(100_000);
  });

  it("never returns a negative tax and leaves taxes empty without a purchase price", () => {
    const loss = computeReference({ pricePerSqm: 67_500, sqm: 60, years: 0, contractPrice: 5_000_000, purchasePrice: 8_000_000 });
    expect(loss.capitalGainsTax).toBe(0);
    const none = computeReference({ pricePerSqm: 67_500, sqm: 60, years: 0, contractPrice: 0, purchasePrice: 0 });
    expect(none.capitalGainsTax).toBeNull();
    expect(none.revaluationTax).toBeNull();
  });

  it("estimates the annual building tax at 0.05% with the municipal ±30% band", () => {
    const r = computeReference({ pricePerSqm: 67_500, sqm: 60, years: 0, contractPrice: 0, purchasePrice: 0 });
    expect(r.buildingTaxYear.mid).toBe(2_025);
    expect(r.buildingTaxYear.low).toBe(1_418);
    expect(r.buildingTaxYear.high).toBe(2_633);
  });
});

describe("reference tables", () => {
  it("has the official counts and unique keys", () => {
    expect(TIRANA_ZONES).toHaveLength(32);
    expect(TIRANA_UNITS).toHaveLength(13);
    expect(new Set(ALL_REFERENCE_PLACES.map((p) => p.key)).size).toBe(ALL_REFERENCE_PLACES.length);
  });

  it("keeps the values checked against VKM 132/2018 on 2026-10-21", () => {
    const byKey = Object.fromEntries(ALL_REFERENCE_PLACES.map((p) => [p.key, p.value]));
    expect(byKey["durres"]).toBe(67_500);
    expect(byKey["vlore"]).toBe(61_800);
    expect(byKey["sarande"]).toBe(56_000);
    expect(byKey["tirane-5/1"]).toBe(228_400);
    expect(byKey["tirane-2/4"]).toBe(120_300);
    expect(OUTSIDE_TIRANA.every((p) => p.value > 0)).toBe(true);
  });
});

describe("formatSq", () => {
  it("groups thousands with a dot", async () => {
    const { formatSq } = await import("../data");
    expect(formatSq(67_500)).toBe("67.500");
    expect(formatSq(1_500)).toBe("1.500");
    expect(formatSq(7_308_225)).toBe("7.308.225");
    expect(formatSq(950)).toBe("950");
  });
});
