import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { buildPropertyCardAlt, propertyCardCanonicalCoverUrl } from "@/lib/property/propertyCardImages";
import { buildPropertyImageAlt, propertyImageFeatures } from "../propertyImageAlt";

const flat = {
  index: 2,
  total: 14,
  typeSlug: "apartment",
  bedrooms: 1,
  areaM2: 61,
  deal: "sale",
  features: ["seaView" as const, "nearSea" as const],
};

describe("buildPropertyImageAlt", () => {
  it("writes English with the place after 'in'", () => {
    expect(
      buildPropertyImageAlt({ ...flat, locale: "en", typeLabel: "Apartment", district: "Plazh", city: "Durrës" }),
    ).toBe("1+1 apartment for sale in Plazh, Durrës, 61 m², sea view — photo 3 of 14");
  });

  it("writes German with the noun first", () => {
    expect(
      buildPropertyImageAlt({ ...flat, locale: "de", typeLabel: "Wohnung", district: "Plazh", city: "Durrës" }),
    ).toBe("Wohnung 1+1 zum Kauf in Plazh, Durrës, 61 m², Meerblick — Foto 3 von 14");
  });

  it("lists the parts in the declining languages, so no place name needs a case", () => {
    expect(
      buildPropertyImageAlt({ ...flat, locale: "ru", typeLabel: "Квартира", district: "Плаж", city: "Дуррес" }),
    ).toBe("Квартира 1+1, продажа, Плаж, Дуррес, 61 м², вид на море — фото 3 из 14");
    expect(
      buildPropertyImageAlt({ ...flat, locale: "uk", typeLabel: "Квартира", district: "Плаж", city: "Дуррес" }),
    ).toBe("Квартира 1+1, продаж, Плаж, Дуррес, 61 м², вид на море — фото 3 з 14");
    expect(
      buildPropertyImageAlt({ ...flat, locale: "pl", typeLabel: "Mieszkanie", district: "Plazh", city: "Durrës" }),
    ).toBe("Mieszkanie 1+1, sprzedaż, Plazh, Durrës, 61 m², widok na morze — zdjęcie 3 z 14");
  });

  it("covers Albanian and Italian", () => {
    expect(
      buildPropertyImageAlt({ ...flat, locale: "sq", typeLabel: "Apartament", district: "Plazh", city: "Durrës", deal: "rent" }),
    ).toBe("Apartament 1+1, me qira, Plazh, Durrës, 61 m², pamje nga deti — foto 3 nga 14");
    expect(
      buildPropertyImageAlt({ ...flat, locale: "it", typeLabel: "Appartamento", district: "Plazh", city: "Durazzo" }),
    ).toBe("Appartamento 1+1, in vendita, Plazh, Durazzo, 61 m², vista mare — foto 3 di 14");
  });

  it("has a dictionary for every routed locale", () => {
    for (const locale of routing.locales) {
      const alt = buildPropertyImageAlt({ locale, index: 0, total: 2, deal: "sale", features: ["newBuild"] });
      // An unknown locale would fall back to English.
      if (locale !== "en") expect(alt).not.toContain("for sale");
      expect(alt.length).toBeGreaterThan(10);
    }
  });

  it("differs on every photo of a listing", () => {
    const alts = Array.from({ length: 14 }, (_, index) =>
      buildPropertyImageAlt({ ...flat, index, locale: "en", typeLabel: "Apartment", city: "Durrës" }),
    );
    expect(new Set(alts).size).toBe(14);
  });

  it("keeps the room notation for flats only and drops what is missing", () => {
    expect(
      buildPropertyImageAlt({ locale: "en", index: 0, total: 1, typeLabel: "Villa", typeSlug: "villa", bedrooms: 4, city: "Vlorë" }),
    ).toBe("Villa in Vlorë");
    expect(buildPropertyImageAlt({ locale: "en", index: 0, total: 3 })).toBe("Property — photo 1 of 3");
    expect(
      buildPropertyImageAlt({ locale: "en", index: 0, total: 1, typeLabel: "Land", district: "Durrës", city: "Durrës", areaM2: 0 }),
    ).toBe("Land in Durrës");
  });
});

describe("propertyImageFeatures", () => {
  it("prefers the view, then the distance, then the stage", () => {
    expect(
      propertyImageFeatures({
        amenitySlugs: ["balcony", "sea-view"],
        seaDistanceMeters: 120,
        nearSeaMaxMeters: 300,
        constructionStage: "off-plan",
      }),
    ).toEqual(["seaView", "nearSea", "newBuild"]);
    expect(propertyImageFeatures({ seaDistanceMeters: 900, nearSeaMaxMeters: 300, constructionStage: "completed" })).toEqual([]);
    expect(propertyImageFeatures({ beachfront: true, nearSeaMaxMeters: 300 })).toEqual(["nearSea"]);
  });
});

describe("buildPropertyCardAlt", () => {
  it("adds only the place the title does not already name", () => {
    expect(buildPropertyCardAlt({ name: "Sea view flat in Durrës", district: "Plazh", city: "Durrës" })).toBe(
      "Sea view flat in Durrës, Plazh",
    );
    expect(buildPropertyCardAlt({ name: "Bright studio", district: "Plazh", city: "Durrës" })).toBe(
      "Bright studio, Plazh, Durrës",
    );
    expect(buildPropertyCardAlt({ name: "Flat in PLAZH, durrës", district: "Plazh", city: "Durrës" })).toBe(
      "Flat in PLAZH, durrës",
    );
    expect(buildPropertyCardAlt({ name: "", district: "Durrës", city: "Durrës" })).toBe("Durrës");
  });
});

describe("propertyCardCanonicalCoverUrl", () => {
  it("publishes the cover under the address the listing page uses for photo 1", () => {
    const src = "https://cdn.sanity.io/images/p/production/aaa-1280x753.jpg";
    expect(
      propertyCardCanonicalCoverUrl({
        images: [{ src }],
        propertyTypeSlug: "apartment",
        beds: 2,
        districtSlug: "plazh",
        citySlug: "durres",
      }),
    ).toBe(`${src}/apartment-2-1-plazh-durres-1.jpg?w=1600&fit=max&auto=format&q=75`);
    expect(propertyCardCanonicalCoverUrl({ images: [], beds: 0 })).toBeNull();
  });
});
