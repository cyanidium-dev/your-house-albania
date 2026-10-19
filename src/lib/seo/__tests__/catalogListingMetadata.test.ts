import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sanity/client", () => ({ fetchCatalogProperties: async () => null }));

const { listingPageQuery, listingPaginationPage, listingUrlHasQueryParams, shouldCatalogListingNoindex } =
  await import("../catalogListingMetadata");

describe("listingPaginationPage (audit M-2)", () => {
  it("names a later page when the query is page alone", () => {
    expect(listingPaginationPage({ page: "2" })).toBe(2);
    expect(listingPaginationPage({ page: "31" })).toBe(31);
    expect(listingPaginationPage({ page: " 3 " })).toBe(3);
  });

  it("ignores tracking parameters beside the page", () => {
    expect(listingPaginationPage({ page: "2", utm_source: "newsletter", gclid: "x" })).toBe(2);
  });

  it("is null for page one, no query and a bad page", () => {
    expect(listingPaginationPage({})).toBeNull();
    expect(listingPaginationPage({ utm_source: "x" })).toBeNull();
    expect(listingPaginationPage({ page: "1" })).toBeNull();
    expect(listingPaginationPage({ page: "0" })).toBeNull();
    expect(listingPaginationPage({ page: "abc" })).toBeNull();
    expect(listingPaginationPage({ page: "02" })).toBeNull();
    expect(listingPaginationPage({ page: ["2", "3"] })).toBeNull();
  });

  it("is null as soon as any other parameter is present", () => {
    expect(listingPaginationPage({ page: "2", sort: "priceAsc" })).toBeNull();
    expect(listingPaginationPage({ page: "2", pageSize: "24" })).toBeNull();
    expect(listingPaginationPage({ page: "2", minPrice: "50000" })).toBeNull();
    expect(listingPaginationPage({ page: "2", view: "map" })).toBeNull();
  });

  it("skips empty values", () => {
    expect(listingPaginationPage({ page: "2", sort: "", types: [] })).toBe(2);
    expect(listingPaginationPage({ page: "2", sort: undefined })).toBe(2);
  });
});

describe("listingPageQuery", () => {
  it("appends ?page=N for a later page only", () => {
    expect(listingPageQuery(2)).toBe("?page=2");
    expect(listingPageQuery(1)).toBe("");
    expect(listingPageQuery(null)).toBe("");
    expect(listingPageQuery(undefined)).toBe("");
  });
});

describe("query rules for everything that is not a bare page N", () => {
  it("still flags filters, sort and later pages as query URLs", () => {
    expect(listingUrlHasQueryParams({ page: "2" })).toBe(true);
    expect(listingUrlHasQueryParams({})).toBe(false);
    expect(shouldCatalogListingNoindex({ page: "2" })).toBe(true);
    expect(shouldCatalogListingNoindex({ sort: "priceAsc" })).toBe(true);
    expect(shouldCatalogListingNoindex({ sort: "newest" })).toBe(false);
  });
});
