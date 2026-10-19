import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sanity/socialMetadataResolution", () => ({ buildOgImageArray: () => undefined }));

const { listingPageTitle, listingTitleField } = await import("../listingTitle");
const { MAX_LISTING_TITLE_LENGTH } = await import("../brandTitle");

describe("listing title on a later page (audit M-2)", () => {
  it("leaves page one alone", () => {
    expect(listingTitleField("Durrës apartments")).toEqual({ absolute: "Durrës apartments — Domlivo" });
    expect(listingTitleField("Durrës apartments", { page: 1, locale: "en" })).toEqual({
      absolute: "Durrës apartments — Domlivo",
    });
    expect(listingTitleField("Durrës apartments", { page: null, locale: "en" })).toEqual({
      absolute: "Durrës apartments — Domlivo",
    });
  });

  it("names the page in the page's language", () => {
    expect(listingTitleField("Durrës apartments", { page: 2, locale: "en" })).toEqual({
      absolute: "Durrës apartments — Page 2 — Domlivo",
    });
    expect(listingPageTitle("Prona në Durrës", { page: 3, locale: "sq" })).toBe("Prona në Durrës — Faqja 3");
    expect(listingPageTitle("Nieruchomości", { page: 4, locale: "pl" })).toBe("Nieruchomości — Strona 4");
    expect(listingPageTitle("Недвижимость", { page: 5, locale: "ru" })).toBe("Недвижимость — Страница 5");
    expect(listingPageTitle("Нерухомість", { page: 5, locale: "uk" })).toBe("Нерухомість — Сторінка 5");
    expect(listingPageTitle("Immobilien", { page: 6, locale: "de" })).toBe("Immobilien — Seite 6");
    expect(listingPageTitle("Immobili", { page: 7, locale: "it" })).toBe("Immobili — Pagina 7");
    expect(listingPageTitle("X", { page: 2, locale: "xx" })).toBe("X — Page 2");
  });

  it("drops trailing title segments before it drops the page number", () => {
    const long = "Property for Sale in Albania — Apartments, Houses & Beach Homes";
    const field = listingTitleField(long, { page: 12, locale: "en" }) as { absolute: string };
    expect(field.absolute).toBe("Property for Sale in Albania — Page 12 — Domlivo");
    // A first segment that alone fills the line keeps the suffix and loses the brand.
    const filled = "Durrës Real Estate: Apartments, Houses and Beach Homes";
    const fieldFilled = listingTitleField(filled, { page: 3, locale: "en" }) as { absolute: string };
    expect(fieldFilled.absolute).toBe(`${filled} — Page 3`);
    expect(MAX_LISTING_TITLE_LENGTH).toBe(60);
  });
});
