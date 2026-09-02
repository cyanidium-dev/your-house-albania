import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Regression cover for the duplicate-title defect: the `catalogSeoPage` this
 * route reads is root-scoped, so `/sale` and `/sale/apartment` were shipping
 * byte-identical titles and descriptions in all six locales.
 */

const CMS_TITLE = "Nieruchomości w Albanii — mieszkania i domy na sprzedaż";
const CMS_DESCRIPTION = "Kup nieruchomość w Albanii: mieszkania nad morzem, domy i wille.";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) =>
    key === "title" ? "Listing title" : "Listing description",
}));

const fetchCatalogSeoPageRoot = vi.fn();
const resolveCatalogSeoPage = vi.fn();
vi.mock("@/lib/sanity/client", () => ({
  fetchCatalogSeoPageRoot: () => fetchCatalogSeoPageRoot(),
  resolveCatalogSeoPage: (raw: unknown, locale: string) => resolveCatalogSeoPage(raw, locale),
}));

const buildTypeListingSeo = vi.fn();
vi.mock("@/lib/seo/listingSeoCopy", () => ({
  buildTypeListingSeo: (...args: unknown[]) => buildTypeListingSeo(...args),
}));

vi.mock("@/lib/seo/envSeo", () => ({
  isIndexingEnabled: () => true,
  indexingDisabledRobots: { index: false, follow: false },
}));

vi.mock("@/lib/seo/catalogListingMetadata", () => ({
  listingUrlHasQueryParams: () => false,
  shouldNoindexNonGeoDealTypeCombo: async () => false,
}));

vi.mock("@/lib/siteUrl", () => ({ getSiteBaseUrl: () => "https://www.domlivo.com" }));
vi.mock("@/lib/seo/hreflang", () => ({
  buildHreflangAlternates: () => ({ languages: { en: "https://www.domlivo.com/en/sale" } }),
}));

const { generateNonGeoDealRouteMetadata } = await import("../nonGeoDealRouteMetadata");

beforeEach(() => {
  fetchCatalogSeoPageRoot.mockReset().mockResolvedValue({});
  resolveCatalogSeoPage
    .mockReset()
    .mockReturnValue({ metaTitle: CMS_TITLE, metaDescription: CMS_DESCRIPTION, noIndex: false });
  buildTypeListingSeo.mockReset();
});

const run = (filters: string[]) =>
  generateNonGeoDealRouteMetadata({
    locale: "pl",
    filters,
    search: {},
    dealQuery: "sale",
    titleFragment: "sale",
  });

describe("generateNonGeoDealRouteMetadata", () => {
  it("keeps the CMS copy on the untyped deal page", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    const meta = await run([]);
    expect(meta.title).toBe(CMS_TITLE);
    expect(meta.description).toBe(CMS_DESCRIPTION);
    expect(buildTypeListingSeo).not.toHaveBeenCalled();
  });

  it("lets type copy override the type-agnostic CMS title on a type page", async () => {
    buildTypeListingSeo.mockResolvedValue({
      title: "Mieszkania w Albanii na sprzedaż",
      description: "Mieszkania na sprzedaż w Albanii: aktualne ceny.",
    });
    const meta = await run(["apartment"]);
    expect(buildTypeListingSeo).toHaveBeenCalledWith("apartment", "pl");
    expect(meta.title).toBe("Mieszkania w Albanii na sprzedaż");
    expect(meta.description).toBe("Mieszkania na sprzedaż w Albanii: aktualne ceny.");
    // The defect being fixed: this must not be the root CMS copy.
    expect(meta.description).not.toBe(CMS_DESCRIPTION);
  });

  it("falls back to the CMS copy when the type has no dedicated wording", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    const meta = await run(["bungalow"]);
    expect(meta.title).toBe(CMS_TITLE);
    expect(meta.description).toBe(CMS_DESCRIPTION);
  });

  it("decodes a percent-encoded type segment before looking up copy", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    await run(["commercial%2Dspace"]);
    expect(buildTypeListingSeo).toHaveBeenCalledWith("commercial-space", "pl");
  });
});
