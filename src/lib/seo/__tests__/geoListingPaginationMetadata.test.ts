import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Audit M-2: `/en/albania/durres?page=3` answered `noindex, follow` with a
 * canonical to page one. A later page alone is now self-canonical and exactly
 * as indexable as the bare page; any other parameter keeps the old rule.
 */

const BASE = "https://www.domlivo.com";

// Components the route module imports for the page half; metadata never renders them.
vi.mock("@/components/catalog/CatalogHero", () => ({ CatalogHero: () => null }));
vi.mock("@/components/catalog/ListingPlaceInfoLink", () => ({ ListingPlaceInfoLink: () => null }));
vi.mock("@/components/catalog/ListingFacetNav", () => ({ ListingFacetNav: () => null }));
vi.mock("@/components/catalog/ListingFactsLine", () => ({ ListingFactsLine: () => null }));
vi.mock("@/components/Properties/PropertyList", () => ({ default: () => null }));
vi.mock("@/components/shared/CatalogBreadcrumb", () => ({ CatalogBreadcrumb: () => null }));
vi.mock("@/components/catalog/geoListing/ListingDepthSections", () => ({ ListingDepthSections: () => null }));
vi.mock("@/components/catalog/ListingContactBar", () => ({ ListingContactBar: () => null }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), permanentRedirect: vi.fn(), redirect: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => undefined,
}));

const decision = { indexable: true, indexableLocales: ["en", "pl"] as string[] };
vi.mock("@/lib/sanity/client", () => ({
  fetchPropertyBySlug: async () => null,
  fetchSiteSettings: async () => ({}),
  fetchCatalogSeoPageByCity: async () => null,
  fetchCatalogSeoPageByDistrict: async () => null,
  resolveCatalogSeoPage: () => null,
  fetchCatalogFilterOptions: async () => ({
    propertyTypes: [{ value: "apartment", label: "Apartment" }],
    districts: [{ value: "golem", label: "Golem", citySlug: "durres" }],
    locations: [{ value: "durres", label: "Durrës" }],
  }),
  fetchCatalogListingStats: async () => ({ count: 40, priceFrom: 50000 }),
  fetchCityCountrySlugByCitySlug: async () => "albania",
  fetchSeoPageDecision: async () => ({ decision }),
  fetchCatalogProperties: async () => null,
}));
vi.mock("@/lib/seo/pages", () => ({
  SEO_PAGE_FAMILIES: {},
  isSeoPageIndexableIn: (d: typeof decision, locale: string) => d.indexable && d.indexableLocales.includes(locale),
  seoPageKeyFromListingRoute: () => "page-key",
}));
vi.mock("@/lib/seo/listingSeoCopy", () => ({
  resolveCityDisplayName: async () => "Durrës",
  buildCityListingSeo: async () => ({ title: "Durrës real estate", description: "Homes in Durrës." }),
  buildCityTypeListingSeo: async () => null,
  buildCityDistrictListingSeo: async (_c: string, label: string) => ({ title: `${label} real estate`, description: "d" }),
  buildFacetListingSeo: async () => ({ title: "Sea-view flats in Durrës", description: "f" }),
}));
vi.mock("@/lib/seo/ogImageUrl", () => ({ landingOgImageUrl: () => `${BASE}/api/og` }));
vi.mock("@/lib/media/albaniaPhotos", () => ({ heroPhotoFor: () => ({ key: "durres" }) }));
vi.mock("@/lib/seo/envSeo", () => ({
  isIndexingEnabled: () => true,
  indexingDisabledRobots: { index: false, follow: false },
  indexableRobots: { index: true, follow: true, "max-image-preview": "large" },
}));
vi.mock("@/lib/siteUrl", () => ({ getSiteBaseUrl: () => BASE }));
const buildHreflangAlternates = vi.fn((path: string, locales: readonly string[] = []) => ({
  languages: Object.fromEntries(locales.map((l) => [l, `${BASE}/${l}${path}`])),
}));
vi.mock("@/lib/seo/hreflang", () => ({
  buildHreflangAlternates: (path: string, locales?: readonly string[]) => buildHreflangAlternates(path, locales),
}));
vi.mock("@/lib/routes/catalog", () => ({
  isReservedFilterCountrySegment: () => false,
  catalogFilterPath: (i: { locale: string; country?: string; city: string; district?: string; facet?: string }) =>
    `/${i.locale}/${i.country}/${i.city}${i.district ? `/${i.district}` : ""}${i.facet ? `/${i.facet}` : ""}`,
}));
vi.mock("@/lib/routes/listingRouteResolver", () => ({
  canonicalCatalogGeoListingHref: () => "",
  getGeoListingDistrictNormalizeRedirectUrl: () => null,
  getGeoListingDuplicateFacetRedirectUrl: () => null,
  mergeListingSearchParams: (s: Record<string, unknown>) => ({ ...s }),
  normalizeListingPathSegment: (s: string) => s.toLowerCase(),
  resolveCatalogGeoListingInterpretation: async () => ({
    mode: "fullGeo",
    listingCitySlug: "durres",
    listingCountrySlug: "albania",
  }),
  resolveListingPathFilters: (filters: string[]) => ({
    dealType: "",
    propertyType: "",
    dealQuery: "",
    district: filters[0] === "golem" ? "golem" : "",
    facet: filters[filters.length - 1] === "near-the-sea" ? "near-the-sea" : undefined,
  }),
  resolveOmitCountryListingPathFilters: () => null,
}));

const { geoListingMetadata } = await import("@/components/catalog/geoListing/GeoListingRoute");

const run = (filters: string[], search: Record<string, string> = {}, locale = "en") =>
  geoListingMetadata({ params: { locale, country: "albania", city: "durres", filters }, search });

beforeEach(() => {
  decision.indexable = true;
  decision.indexableLocales = ["en", "pl"];
  buildHreflangAlternates.mockClear();
});

describe("geo listing pagination metadata", () => {
  it("city ?page=3: self-canonical, indexable, hreflang to page 3", async () => {
    const meta = await run([], { page: "3" });
    expect(meta.alternates?.canonical).toBe(`${BASE}/en/albania/durres?page=3`);
    expect(meta.robots).toEqual({ index: true, follow: true, "max-image-preview": "large" });
    expect(meta.alternates?.languages).toEqual({
      en: `${BASE}/en/albania/durres?page=3`,
      pl: `${BASE}/pl/albania/durres?page=3`,
    });
    expect(meta.title).toEqual({ absolute: "Durrës real estate — Page 3 — Domlivo" });
    expect(meta.openGraph?.url).toBe(`${BASE}/en/albania/durres?page=3`);
  });

  it("district ?page=2 follows the district's own decision", async () => {
    const meta = await run(["golem"], { page: "2" });
    expect(meta.alternates?.canonical).toBe(`${BASE}/en/albania/durres/golem?page=2`);
    expect(meta.robots).toMatchObject({ index: true });
  });

  it("noindexed place: page N stays noindex, self-canonical, no alternates", async () => {
    decision.indexable = false;
    const meta = await run([], { page: "2" });
    expect(meta.alternates?.canonical).toBe(`${BASE}/en/albania/durres?page=2`);
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.languages).toBeUndefined();
  });

  it("a locale the registry does not index: noindex, no alternates", async () => {
    const meta = await run([], { page: "2" }, "it");
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe(`${BASE}/it/albania/durres?page=2`);
    expect(meta.alternates?.languages).toBeUndefined();
  });

  it("page N with a filter keeps the old rule: noindex, canonical to the bare path", async () => {
    const meta = await run([], { page: "2", sort: "priceAsc" });
    expect(meta.alternates?.canonical).toBe(`${BASE}/en/albania/durres`);
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.title).toEqual({ absolute: "Durrës real estate — Domlivo" });
  });

  it("facet ?page=2: self-canonical, indexable when the facet is", async () => {
    const meta = await run(["near-the-sea"], { page: "2" });
    expect(meta.alternates?.canonical).toBe(`${BASE}/en/albania/durres/near-the-sea?page=2`);
    expect(meta.robots).toMatchObject({ index: true });
    expect(meta.alternates?.languages).toMatchObject({ en: `${BASE}/en/albania/durres/near-the-sea?page=2` });
    const filtered = await run(["near-the-sea"], { page: "2", minPrice: "1" });
    expect(filtered.alternates?.canonical).toBe(`${BASE}/en/albania/durres/near-the-sea`);
    expect(filtered.robots).toEqual({ index: false, follow: true });
  });

  it("the bare page is unchanged", async () => {
    const meta = await run([]);
    expect(meta.alternates?.canonical).toBe(`${BASE}/en/albania/durres`);
    expect(meta.robots).toMatchObject({ index: true });
    expect(buildHreflangAlternates).toHaveBeenCalledWith("/albania/durres", ["en", "pl"]);
  });
});
