import { describe, expect, it } from "vitest";
import { MAX_TITLE_LENGTH_WITH_BRAND, stripBrandSuffix, withBrand } from "../brandTitle";

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
});
