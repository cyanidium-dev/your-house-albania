import { describe, expect, it } from "vitest";
import { buildPropertyGalleryImages } from "../propertyGalleryImages";

const A = "https://cdn.sanity.io/images/p/production/aaa-1280x753.jpg";
const B = "https://cdn.sanity.io/images/p/production/bbb-1280x960.png";

describe("buildPropertyGalleryImages", () => {
  const facts = {
    typeLabel: "Apartment",
    typeSlug: "apartment",
    bedrooms: 2,
    areaM2: 84,
    district: "Plazh",
    districtSlug: "plazh",
    city: "Durrës",
    citySlug: "durres",
    deal: "sale",
    seaDistanceMeters: 150,
  };

  it("names each photo the same way in every locale and describes it in the page locale", () => {
    const en = buildPropertyGalleryImages([{ url: A }, { url: B, label: " Balcony " }], { ...facts, locale: "en" });
    const ru = buildPropertyGalleryImages([{ url: A }, { url: B }], {
      ...facts,
      locale: "ru",
      typeLabel: "Квартира",
      district: "Плаж",
      city: "Дуррес",
    });
    expect(en.map((i) => i.url)).toEqual([
      `${A}/apartment-2-1-plazh-durres-1.jpg`,
      `${B}/apartment-2-1-plazh-durres-2.png`,
    ]);
    expect(ru.map((i) => i.url)).toEqual(en.map((i) => i.url));
    expect(en[1]).toEqual({
      url: `${B}/apartment-2-1-plazh-durres-2.png`,
      alt: "2+1 apartment for sale in Plazh, Durrës, 84 m², near the sea — photo 2 of 2",
      label: "Balcony",
    });
    expect(ru[0].alt).toBe("Квартира 2+1, продажа, Плаж, Дуррес, 84 м², рядом с морем — фото 1 из 2");
  });
});
