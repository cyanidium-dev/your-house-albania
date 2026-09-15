import { describe, expect, it } from "vitest";
import {
  LISTING_FACETS,
  LISTING_FACET_SLUGS,
  facetCatalogFilters,
  isListingFacetSlug,
  withFacetQuery,
  type FacetPropertyRow,
} from "../listingFacets";

/**
 * The sitemap counts facet pages with `matches`, the route lists them with
 * `query`. If the two drift, the sitemap advertises pages the route noindexes
 * (or hides pages it indexes). These rows pin the boundaries of each facet.
 */
const rows: Record<string, FacetPropertyRow> = {
  studio45k: { typeSlug: "studio", bedrooms: null, price: 45000, priceUnit: "total" },
  oneBed79k: { typeSlug: "apartment", bedrooms: 1, price: 79000, priceUnit: "total" },
  oneBed80k: { typeSlug: "apartment", bedrooms: 1, price: 80000 },
  twoBed95k: { typeSlug: "apartment", bedrooms: 2, price: 95000, priceUnit: "total", constructionStage: "under-construction" },
  threeBed: { typeSlug: "apartment", bedrooms: 3, price: 180000, priceUnit: "total", constructionStage: "completed" },
  fourBed: { typeSlug: "apartment", bedrooms: 4, price: 250000, priceUnit: "total" },
  perSqm: { typeSlug: "apartment", bedrooms: 1, price: 1300, priceUnit: "per-sqm", constructionStage: "off-plan" },
  land50k: { typeSlug: "land", price: 50000, priceUnit: "total" },
};

function matching(slug: keyof typeof LISTING_FACETS): string[] {
  return Object.entries(rows)
    .filter(([, r]) => LISTING_FACETS[slug].matches(r))
    .map(([k]) => k);
}

describe("listing facets", () => {
  it("counts rooms exactly for 1+1 and 2+1, and as a minimum for 3+1", () => {
    expect(matching("1-1")).toEqual(["oneBed79k", "oneBed80k", "perSqm"]);
    expect(matching("2-1")).toEqual(["twoBed95k"]);
    expect(matching("3-1")).toEqual(["threeBed", "fourBed"]);
  });

  it("keeps budgets to apartments and studios with a total price, inclusive of the cap", () => {
    expect(matching("under-80k")).toEqual(["studio45k", "oneBed79k", "oneBed80k"]);
    expect(matching("under-100k")).toEqual(["studio45k", "oneBed79k", "oneBed80k", "twoBed95k"]);
  });

  it("treats off-plan and under-construction as new builds", () => {
    expect(matching("new-builds")).toEqual(["twoBed95k", "perSqm"]);
  });

  it("expresses each facet's query as the same filters", () => {
    expect(facetCatalogFilters("1-1")).toEqual({ type: "apartment", bedsExact: 1 });
    expect(facetCatalogFilters("3-1")).toEqual({ type: "apartment", beds: 3 });
    expect(facetCatalogFilters("under-100k")).toEqual({ types: ["apartment", "studio"], maxPrice: 100000 });
    expect(facetCatalogFilters("new-builds")).toEqual({ stage: "unfinished" });
  });

  it("recognises only registered slugs", () => {
    for (const slug of LISTING_FACET_SLUGS) expect(isListingFacetSlug(slug)).toBe(true);
    expect(isListingFacetSlug("golem-durres")).toBe(false);
    expect(isListingFacetSlug("sale")).toBe(false);
    expect(isListingFacetSlug(undefined)).toBe(false);
  });

  it("lets the facet win over a stray query copy", () => {
    expect(withFacetQuery({ type: "villa", sort: "priceAsc" }, "1-1")).toEqual({
      type: "apartment",
      bedsExact: "1",
      sort: "priceAsc",
    });
    expect(withFacetQuery({ sort: "newest" }, "")).toEqual({ sort: "newest" });
  });
});
