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
  fetchCatalogProperties: async () => null,
}));

const buildTypeListingSeo = vi.fn();
vi.mock("@/lib/seo/listingSeoCopy", () => ({
  buildTypeListingSeo: (...args: unknown[]) => buildTypeListingSeo(...args),
}));

vi.mock("@/lib/seo/envSeo", () => ({
  isIndexingEnabled: () => true,
  indexingDisabledRobots: { index: false, follow: false },
  indexableRobots: { index: true, follow: true, "max-image-preview": "large" },
}));

// The real query rules (page N vs filters); only the inventory lookup is stubbed.
vi.mock("@/lib/seo/catalogListingMetadata", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../catalogListingMetadata")>()),
  shouldNoindexNonGeoDealTypeCombo: async () => false,
}));

vi.mock("@/lib/siteUrl", () => ({ getSiteBaseUrl: () => "https://www.domlivo.com" }));
const buildHreflangAlternates = vi.fn((path: string) => ({
  languages: { en: `https://www.domlivo.com/en${path}`, pl: `https://www.domlivo.com/pl${path}` },
}));
vi.mock("@/lib/seo/hreflang", () => ({
  buildHreflangAlternates: (path: string) => buildHreflangAlternates(path),
}));

const { generateNonGeoDealRouteMetadata } = await import("../nonGeoDealRouteMetadata");

beforeEach(() => {
  fetchCatalogSeoPageRoot.mockReset().mockResolvedValue({});
  resolveCatalogSeoPage
    .mockReset()
    .mockReturnValue({ metaTitle: CMS_TITLE, metaDescription: CMS_DESCRIPTION, noIndex: false });
  buildTypeListingSeo.mockReset();
  buildHreflangAlternates.mockClear();
});

const run = (filters: string[], search: Record<string, string> = {}) =>
  generateNonGeoDealRouteMetadata({
    locale: "pl",
    filters,
    search,
    dealQuery: "sale",
    titleFragment: "sale",
  });

describe("generateNonGeoDealRouteMetadata", () => {
  it("keeps the CMS copy on the untyped deal page", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    const meta = await run([]);
    // 56 characters: no room for the brand (lib/seo/brandTitle).
    expect(meta.title).toEqual({ absolute: CMS_TITLE });
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
    expect(meta.title).toEqual({ absolute: "Mieszkania w Albanii na sprzedaż — Domlivo" });
    expect(meta.description).toBe("Mieszkania na sprzedaż w Albanii: aktualne ceny.");
    // The defect being fixed: this must not be the root CMS copy.
    expect(meta.description).not.toBe(CMS_DESCRIPTION);
    // An indexable listing asks for large image previews.
    expect(meta.robots).toEqual({ index: true, follow: true, "max-image-preview": "large" });
  });

  it("falls back to the CMS copy when the type has no dedicated wording", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    const meta = await run(["bungalow"]);
    // 56 characters: no room for the brand (lib/seo/brandTitle).
    expect(meta.title).toEqual({ absolute: CMS_TITLE });
    expect(meta.description).toBe(CMS_DESCRIPTION);
  });

  it("decodes a percent-encoded type segment before looking up copy", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    await run(["commercial%2Dspace"]);
    expect(buildTypeListingSeo).toHaveBeenCalledWith("commercial-space", "pl");
  });
});

describe("generateNonGeoDealRouteMetadata — pagination (audit M-2)", () => {
  const SALE = "https://www.domlivo.com/pl/sale";

  it("makes ?page=N self-canonical and as indexable as page one", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    const meta = await run([], { page: "2" });
    expect(meta.alternates?.canonical).toBe(`${SALE}?page=2`);
    expect(meta.robots).toEqual({ index: true, follow: true, "max-image-preview": "large" });
    expect(buildHreflangAlternates).toHaveBeenCalledWith("/sale?page=2");
    expect(meta.alternates?.languages).toEqual({
      en: "https://www.domlivo.com/en/sale?page=2",
      pl: `${SALE}?page=2`,
    });
    expect(meta.openGraph?.url).toBe(`${SALE}?page=2`);
    expect(meta.title).toEqual({ absolute: "Nieruchomości w Albanii — Strona 2 — Domlivo" });
  });

  it("keeps the page number when tracking parameters ride along", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    const meta = await run([], { page: "3", utm_source: "newsletter" });
    expect(meta.alternates?.canonical).toBe(`${SALE}?page=3`);
    expect(meta.robots).toMatchObject({ index: true });
  });

  it("keeps a filtered page N out of the index, canonical to the bare path", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    const meta = await run([], { page: "2", sort: "priceAsc" });
    expect(meta.alternates?.canonical).toBe(SALE);
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.title).toEqual({ absolute: CMS_TITLE });
  });

  it("follows page one into noindex, still self-canonical and with no alternates", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    resolveCatalogSeoPage.mockReturnValue({ metaTitle: CMS_TITLE, metaDescription: CMS_DESCRIPTION, noIndex: true });
    const meta = await run([], { page: "2" });
    expect(meta.alternates?.canonical).toBe(`${SALE}?page=2`);
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.languages).toBeUndefined();
  });

  it("leaves page one unchanged", async () => {
    buildTypeListingSeo.mockResolvedValue(null);
    const meta = await run([]);
    expect(meta.alternates?.canonical).toBe(SALE);
    expect(buildHreflangAlternates).toHaveBeenCalledWith("/sale");
  });
});
