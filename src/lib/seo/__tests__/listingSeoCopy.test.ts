import { describe, expect, it, vi, beforeEach } from "vitest";

import en from "../../../../messages/en.json";
import pl from "../../../../messages/pl.json";
import ru from "../../../../messages/ru.json";
import uk from "../../../../messages/uk.json";
import itMessages from "../../../../messages/it.json";
import sq from "../../../../messages/sq.json";

const MESSAGES: Record<string, typeof en> = {
  en,
  pl: pl as unknown as typeof en,
  ru: ru as unknown as typeof en,
  uk: uk as unknown as typeof en,
  it: itMessages as unknown as typeof en,
  sq: sq as unknown as typeof en,
};

/**
 * Minimal next-intl stand-in: resolves the namespace out of the real message
 * files and interpolates `{placeholders}`, so the assertions below check the
 * shipped copy rather than a fixture that can drift away from it.
 */
vi.mock("next-intl/server", () => ({
  // Both call shapes are in use: the type helpers pass `{ locale, namespace }`,
  // while the older city/country helpers pass the namespace as a bare string and
  // lean on the ambient request locale. The string form resolves against `en`,
  // which is the only locale the tests below exercise through it.
  getTranslations: async (arg: string | { locale: string; namespace: string }) => {
    const namespace = typeof arg === "string" ? arg : arg.namespace;
    const locale = typeof arg === "string" ? "en" : arg.locale;
    const dict = namespace
      .split(".")
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], MESSAGES[locale]);
    return (key: string, values?: Record<string, string>) => {
      const raw = (dict as Record<string, string> | undefined)?.[key];
      if (typeof raw !== "string") return `${namespace}.${key}`;
      return raw.replace(/\{(\w+)\}/g, (_m, name: string) => values?.[name] ?? `{${name}}`);
    };
  },
}));

const fetchCityNameForms = vi.fn();
vi.mock("@/lib/sanity/queries/district", () => ({
  fetchCityNameForms: (...args: unknown[]) => fetchCityNameForms(...args),
}));

const { buildTypeListingSeo, buildCityTypeListingSeo, buildCityListingSeo } = await import(
  "../listingSeoCopy"
);

beforeEach(() => {
  fetchCityNameForms.mockReset();
  fetchCityNameForms.mockImplementation(async (slug: string, locale: string) => ({
    base: slug === "durres" ? "Durrës" : slug === "sarande" ? "Saranda" : slug,
    locative: locale === "sq" && slug === "tirana" ? "Tiranë" : undefined,
  }));
});

describe("buildTypeListingSeo", () => {
  it("targets the market's own phrasing rather than a translation of the English one", async () => {
    await expect(buildTypeListingSeo("apartment", "en")).resolves.toEqual({
      title: "Apartments for Sale in Albania",
      description: expect.stringContaining("Apartments for sale in Albania"),
    });
    // The Polish cluster's target keyword is "mieszkania w albanii".
    await expect(buildTypeListingSeo("apartment", "pl")).resolves.toMatchObject({
      title: "Mieszkania w Albanii na sprzedaż",
    });
    await expect(buildTypeListingSeo("apartment", "sq")).resolves.toMatchObject({
      title: "Apartamente në shitje në Shqipëri",
    });
    await expect(buildTypeListingSeo("villa", "ru")).resolves.toMatchObject({
      title: "Виллы в Албании — купить",
    });
  });

  it("returns null for a type with no copy, so the caller keeps the untyped title", async () => {
    await expect(buildTypeListingSeo("bungalow", "en")).resolves.toBeNull();
    await expect(buildTypeListingSeo("", "en")).resolves.toBeNull();
    await expect(buildTypeListingSeo("   ", "en")).resolves.toBeNull();
  });

  it("accepts a slug in any casing or padding, as it arrives from the URL", async () => {
    await expect(buildTypeListingSeo("  Apartment ", "en")).resolves.toMatchObject({
      title: "Apartments for Sale in Albania",
    });
  });

  it("covers every property type in every locale", async () => {
    const slugs = Object.keys(en.Seo.listing.types);
    for (const locale of Object.keys(MESSAGES)) {
      for (const slug of slugs) {
        const copy = await buildTypeListingSeo(slug, locale);
        expect(copy, `${locale}/${slug}`).not.toBeNull();
        expect(copy!.title, `${locale}/${slug}`).not.toContain("{type}");
        expect(copy!.title, `${locale}/${slug}`).not.toContain("Seo.listing");
      }
    }
  });
});

describe("buildCityTypeListingSeo", () => {
  it("distinguishes the type page from the bare city page", async () => {
    const city = await buildCityListingSeo("durres", "en");
    const cityType = await buildCityTypeListingSeo("durres", "apartment", "en");
    expect(cityType).toMatchObject({ title: "Apartments for Sale in Durrës, Albania" });
    // The whole point of the change: these two URLs must not share a title.
    expect(cityType!.title).not.toBe(city!.title);
    expect(cityType!.description).not.toBe(city!.description);
  });

  it("leads with the nominative city name in the declining locales", async () => {
    // pl/ru/uk store no case forms, so the templates must never put the city
    // after a preposition ("w Sarande" would be wrong for "w Sarandzie").
    await expect(buildCityTypeListingSeo("sarande", "apartment", "pl")).resolves.toMatchObject({
      title: "Mieszkania na sprzedaż — Saranda, Albania",
    });
    await expect(buildCityTypeListingSeo("sarande", "apartment", "ru")).resolves.toMatchObject({
      title: "Квартиры — Saranda, Албания — купить",
    });
  });

  it("uses the Albanian locative the CMS supplies", async () => {
    await expect(buildCityTypeListingSeo("tirana", "apartment", "sq")).resolves.toMatchObject({
      title: "Apartamente në shitje në Tiranë",
    });
  });

  it("returns null when either half is unknown", async () => {
    await expect(buildCityTypeListingSeo("durres", "bungalow", "en")).resolves.toBeNull();
    await expect(buildCityTypeListingSeo("", "apartment", "en")).resolves.toBeNull();
  });
});
