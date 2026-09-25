import { describe, expect, it } from "vitest";
import { priceHistorySteps } from "../priceHistory";

describe("priceHistorySteps", () => {
  it("orders by date and reports the change against the previous price", () => {
    const steps = priceHistorySteps([
      { date: "2026-09-01", price: 85000 },
      { date: "2026-04-30", price: 89050 },
    ]);
    expect(steps.map((s) => s.date)).toEqual(["2026-04-30", "2026-09-01"]);
    expect(steps[0].changePct).toBeUndefined();
    expect(steps[1].changePct).toBe(-4.5);
  });

  it("drops repeats of the same price, undated and zero entries", () => {
    const steps = priceHistorySteps([
      { date: "2026-04-30", price: 89050 },
      { date: "2026-06-01", price: 89050 },
      { date: "bad", price: 1 },
      { date: "2026-07-01", price: 0 },
      null,
    ]);
    expect(steps).toHaveLength(1);
  });

  it("does not compare a rate with a total", () => {
    const steps = priceHistorySteps([
      { date: "2026-04-30", price: 1300, priceUnit: "per-sqm" },
      { date: "2026-06-01", price: 89050, priceUnit: "total" },
    ]);
    expect(steps).toHaveLength(2);
    expect(steps[1].changePct).toBeUndefined();
  });

  it("is empty for nothing", () => {
    expect(priceHistorySteps(undefined)).toEqual([]);
    expect(priceHistorySteps([])).toEqual([]);
  });
});
