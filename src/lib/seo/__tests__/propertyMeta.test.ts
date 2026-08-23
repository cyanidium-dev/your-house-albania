import { describe, it, expect } from "vitest";
import { composePropertyMetaTitle, truncateMetaDescription } from "../propertyMeta";

const BASE = {
  typeLabel: "Apartment",
  area: 42,
  district: "Plazh",
  city: "Durrës",
  price: 73000,
  status: "sale",
  locale: "en",
  areaUnit: "m²",
  perMonth: "month",
};

describe("composePropertyMetaTitle", () => {
  it("names the type, size, place and price", () => {
    expect(composePropertyMetaTitle(BASE)).toBe("Apartment, 42 m², Plazh, Durrës — €73,000");
  });

  // A bare €330 on an apartment reads as a sale price.
  it("marks a rental as per month", () => {
    expect(composePropertyMetaTitle({ ...BASE, price: 330, status: "rent" })).toBe(
      "Apartment, 42 m², Plazh, Durrës — €330/month"
    );
  });

  it("treats short-term as a rental too", () => {
    expect(composePropertyMetaTitle({ ...BASE, price: 60, status: "short-term" })).toContain("/month");
  });

  it("uses the locale's number format and area unit", () => {
    const out = composePropertyMetaTitle({
      ...BASE,
      locale: "ru",
      typeLabel: "Квартира",
      district: "Плаж",
      city: "Дуррес",
      areaUnit: "м²",
    });
    expect(out).toMatch(/^Квартира, 42 м², Плаж, Дуррес — €73\s?000$/);
  });

  it("drops a missing district without leaving a stray comma", () => {
    expect(composePropertyMetaTitle({ ...BASE, district: undefined })).toBe(
      "Apartment, 42 m², Durrës — €73,000"
    );
  });

  it("drops a missing price without leaving a stray dash", () => {
    expect(composePropertyMetaTitle({ ...BASE, price: undefined })).toBe(
      "Apartment, 42 m², Plazh, Durrës"
    );
  });

  it("drops a missing area", () => {
    expect(composePropertyMetaTitle({ ...BASE, area: undefined })).toBe(
      "Apartment, Plazh, Durrës — €73,000"
    );
  });

  // Nothing to compose must not produce a worse title than today's fallback.
  it("returns null when there is nothing to say", () => {
    expect(
      composePropertyMetaTitle({
        ...BASE,
        typeLabel: undefined,
        area: undefined,
        district: undefined,
        city: undefined,
        price: undefined,
      })
    ).toBeNull();
  });

  it("ignores a zero or negative price", () => {
    expect(composePropertyMetaTitle({ ...BASE, price: 0 })).toBe("Apartment, 42 m², Plazh, Durrës");
    expect(composePropertyMetaTitle({ ...BASE, price: -5 })).toBe("Apartment, 42 m², Plazh, Durrës");
  });
});

describe("truncateMetaDescription", () => {
  const long =
    "Bright one-bedroom apartment of 42 square metres in Plazh, Durrës, Albania. The home features a sea view, Wi-Fi, air conditioning and modern furniture throughout the flat.";

  it("cuts on a word boundary and marks the cut", () => {
    const out = truncateMetaDescription(long, 155);
    expect(out.length).toBeLessThanOrEqual(156);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
    expect(long.startsWith(out.slice(0, -1))).toBe(true);
  });

  it("returns a short description byte-identical", () => {
    const short = "A furnished house 3 km from the sea in a quiet part of Vlorë.";
    expect(truncateMetaDescription(short, 155)).toBe(short);
  });

  it("handles empty and missing input", () => {
    expect(truncateMetaDescription("", 155)).toBe("");
    expect(truncateMetaDescription(undefined, 155)).toBe("");
  });

  it("falls back to a hard cut when there is no space to break on", () => {
    const nospace = "x".repeat(200);
    expect(truncateMetaDescription(nospace, 155).length).toBe(156);
  });
});
