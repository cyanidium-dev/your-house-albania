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

  // A development priced "from €1,300/m²" was titled as a €1,300 flat.
  it("marks a per-m² price with the area unit", () => {
    expect(composePropertyMetaTitle({ ...BASE, price: 1300, priceUnit: "per-sqm" })).toBe(
      "Apartment, 42 m², Plazh, Durrës — €1,300/m²",
    );
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

  it("folds a partner listing's line breaks into one line", () => {
    const listed = "1+1 apartment for sale at Golem Beach\nAt Murrizi Resort\n\nFloor: 2nd\n  Parking  ";
    expect(truncateMetaDescription(listed, 155)).toBe(
      "1+1 apartment for sale at Golem Beach At Murrizi Resort Floor: 2nd Parking",
    );
  });

  it("prefers a sentence end inside the window to a word cut", () => {
    const first = "Bright one-bedroom apartment of 42 square metres on the second line in Plazh, Durrës, a short walk from the beach and the promenade.";
    const out = truncateMetaDescription(`${first} The home features a sea view, Wi-Fi and air conditioning.`, 155);
    expect(out).toBe(first);
    expect(out.endsWith("…")).toBe(false);
  });

  it("does not stop at a sentence end that leaves most of the window empty", () => {
    const out = truncateMetaDescription(long, 155);
    expect(out.endsWith("…")).toBe(true);
  });

  it("still cuts on a word when the only sentence end is too early", () => {
    const early = "Sea view. " + "word ".repeat(60);
    const out = truncateMetaDescription(early, 155);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(156);
  });
});
