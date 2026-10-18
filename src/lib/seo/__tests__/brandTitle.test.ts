import { describe, expect, it } from "vitest";
import {
  MAX_LISTING_TITLE_LENGTH,
  MAX_TITLE_LENGTH_WITH_BRAND,
  fitListingTitle,
  stripBrandSuffix,
  withBrand,
} from "../brandTitle";

describe("withBrand", () => {
  it("appends the brand once to a short title", () => {
    expect(withBrand("Guides")).toBe("Guides — Domlivo");
    expect(withBrand("Guides | Domlivo")).toBe("Guides — Domlivo");
    expect(withBrand("Domlivo — Guides")).toBe("Guides — Domlivo");
  });

  it("is the bare brand for an empty or brand-only title", () => {
    expect(withBrand("")).toBe("Domlivo");
    expect(withBrand("Domlivo")).toBe("Domlivo");
  });

  it("leaves a title that fills the line without the brand", () => {
    const long = "Durrës Real Estate: Apartments & Property for Sale in Albania";
    expect(long.length).toBeGreaterThan(MAX_TITLE_LENGTH_WITH_BRAND);
    expect(withBrand(long)).toBe(long);
    // A baked-in brand still comes off, whatever the length.
    expect(withBrand(`${long} — Domlivo`)).toBe(long);
  });

  it("keeps the brand right up to the limit", () => {
    const atLimit = "x".repeat(MAX_TITLE_LENGTH_WITH_BRAND);
    expect(withBrand(atLimit)).toBe(`${atLimit} — Domlivo`);
  });
});

describe("stripBrandSuffix", () => {
  it("removes leading and trailing brand segments", () => {
    expect(stripBrandSuffix("Domlivo — Real estate in Albania — Domlivo")).toBe("Real estate in Albania");
  });

  it("moves a bare trailing brand word into the suffix", () => {
    expect(withBrand("Platform for real estate agents Domlivo")).toBe("Platform for real estate agents — Domlivo");
    expect(withBrand("AI property search — DomLivo")).toBe("AI property search — Domlivo");
    expect(withBrand("Domlivo")).toBe("Domlivo");
    expect(withBrand("About Domlivo")).toBe("About — Domlivo");
  });
});

describe("fitListingTitle", () => {
  it("drops trailing segments of an over-long title until it fits", () => {
    expect(fitListingTitle("Property for Sale in Albania — Apartments, Houses & Beach Homes")).toBe(
      "Property for Sale in Albania",
    );
    expect(withBrand(fitListingTitle("Case in vendita in Albania — comprare casa al mare, prezzi reali"))).toBe(
      "Case in vendita in Albania — Domlivo",
    );
  });

  it("keeps a title that already fits, and one with nothing to drop", () => {
    expect(fitListingTitle("Apartments for Sale in Albania")).toBe("Apartments for Sale in Albania");
    const solid = "Apartments and houses for sale in Durrës, Golem, Shkëmbi i Kavajës and Plazh";
    expect(fitListingTitle(solid)).toBe(solid);
  });

  it("never returns more than the limit when a segment can go", () => {
    const t = fitListingTitle("A".repeat(30) + " — " + "B".repeat(20) + " — " + "C".repeat(20));
    expect(t.length).toBeLessThanOrEqual(MAX_LISTING_TITLE_LENGTH);
    expect(t).toBe("A".repeat(30) + " — " + "B".repeat(20));
  });
});
