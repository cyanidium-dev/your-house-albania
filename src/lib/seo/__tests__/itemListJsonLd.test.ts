import { describe, expect, it } from "vitest";
import { buildItemListJsonLd } from "../itemListJsonLd";

const items = [
  { name: "Flat in Golem", slug: "flat-in-golem", image: "https://cdn.sanity.io/a.jpg" },
  { name: "House in Plazh", slug: "house-in-plazh" },
];

describe("buildItemListJsonLd", () => {
  it("is a plain ItemList without a collection", () => {
    const out = buildItemListJsonLd(items, "https://www.domlivo.com", "en") as Record<string, unknown>;
    expect(out["@type"]).toBe("ItemList");
    expect(out.numberOfItems).toBe(2);
    expect((out.itemListElement as Record<string, unknown>[])[0].url).toBe(
      "https://www.domlivo.com/en/property/flat-in-golem",
    );
  });

  it("wraps a place page's list in a CollectionPage about the place", () => {
    const out = buildItemListJsonLd(items, "https://www.domlivo.com", "de", {
      name: "Wohnungen und Immobilien zum Kauf in Durrës: 358 Angebote",
      placeName: "Durrës",
    }) as Record<string, unknown>;
    expect(out["@type"]).toBe("CollectionPage");
    expect(out.inLanguage).toBe("de");
    expect(out.about).toEqual({ "@type": "Place", name: "Durrës" });
    expect((out.mainEntity as Record<string, unknown>)["@type"]).toBe("ItemList");
    expect((out.mainEntity as Record<string, unknown>).numberOfItems).toBe(2);
  });
});
