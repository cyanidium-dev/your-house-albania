import { describe, expect, it } from "vitest";
import { buildQuickAnswer, layoutLabel, type QuickAnswerText } from "@/lib/property/quickAnswer";

const text: QuickAnswerText = {
  intro: ({ layout, area, place, price, rate }) => `${layout}, ${area} m², ${place}: ${price} (${rate}/m²).`,
  introNoLayout: ({ area, place, price, rate }) => `${area} m², ${place}: ${price} (${rate}/m²).`,
  median: ({ pct, cmp, median, count }) => ` ${pct}% ${cmp} the district median of ${median}/m² across ${count} listings.`,
  medianSame: ({ median, count }) => ` At the district median (${median}/m², ${count} listings).`,
  sea: ({ m, approx }) => ` ${approx === "yes" ? "≈ " : ""}${m} m to the sea.`,
  bedrooms: ({ count }) => `${count} bedroom${count === 1 ? "" : "s"}`,
};
const money = (n: number) => `€${n.toLocaleString("en-US")}`;
const rank = { medianPerSqm: 1290, count: 73, diffPct: -12.4, reliable: true };

describe("layoutLabel", () => {
  it("writes the Albanian notation when rooms exceed bedrooms", () => {
    expect(layoutLabel(2, 3, text)).toBe("2+1");
    expect(layoutLabel(1, 2, text)).toBe("1+1");
  });
  it("falls back to the bedroom count, and to nothing without bedrooms", () => {
    expect(layoutLabel(2, null, text)).toBe("2 bedrooms");
    expect(layoutLabel(2, 2, text)).toBe("2 bedrooms");
    expect(layoutLabel(0, 1, text)).toBeNull();
  });
});

describe("buildQuickAnswer", () => {
  it("puts layout, area, place, price, rate, median gap and sea in two sentences", () => {
    const s = buildQuickAnswer(
      { price: 118000, priceUnit: "total", area: 104, beds: 2, rooms: 3, seaDistanceMeters: 250, place: "Golem, Durrës", districtRank: rank },
      text,
      money,
    );
    expect(s).toBe("2+1, 104 m², Golem, Durrës: €118,000 (€1,135/m²). 12% below the district median of €1,290/m² across 73 listings. 250 m to the sea.");
  });

  it("handles per-m² prices, a listing at the median and an approximate pin", () => {
    const s = buildQuickAnswer(
      { price: 1295, priceUnit: "per-sqm", area: 60, beds: 1, rooms: 2, seaDistanceMeters: 300, seaApproximate: true, place: "Plazh, Durrës", districtRank: { ...rank, diffPct: 0.4 } },
      text,
      money,
    );
    expect(s).toBe("1+1, 60 m², Plazh, Durrës: €77,700 (€1,295/m²). At the district median (€1,290/m², 73 listings). ≈ 300 m to the sea.");
  });

  it("says nothing without a price, an area, a place or a district median", () => {
    const base = { price: 118000, priceUnit: "total", area: 104, beds: 2, rooms: 3, place: "Golem", districtRank: rank };
    expect(buildQuickAnswer({ ...base, price: null }, text, money)).toBeNull();
    expect(buildQuickAnswer({ ...base, area: 0 }, text, money)).toBeNull();
    expect(buildQuickAnswer({ ...base, place: "" }, text, money)).toBeNull();
    expect(buildQuickAnswer({ ...base, districtRank: null }, text, money)).toBeNull();
  });
});
