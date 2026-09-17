import { describe, expect, it } from "vitest";
import {
  EMPTY_CITY_LISTING_NOINDEX_MAX,
  LISTING_DEAL_TYPE_NOINDEX_THRESHOLD,
  shouldNoindexEmptyCityListing,
} from "../listingIndexPolicy";
import { SEO_PAGE_POLICY } from "../pages/policy";

describe("shouldNoindexEmptyCityListing", () => {
  it("drops a listing with no properties", () => {
    expect(shouldNoindexEmptyCityListing(0)).toBe(true);
  });

  it("keeps a listing that has even one property", () => {
    expect(shouldNoindexEmptyCityListing(1)).toBe(false);
    expect(shouldNoindexEmptyCityListing(23)).toBe(false);
  });

  it("treats a failed count as empty rather than assuming inventory", () => {
    expect(shouldNoindexEmptyCityListing(Number.NaN)).toBe(true);
    expect(shouldNoindexEmptyCityListing(Number.POSITIVE_INFINITY)).toBe(true);
  });

  it("treats a negative count as empty", () => {
    expect(shouldNoindexEmptyCityListing(-1)).toBe(true);
  });

  it("keeps the empty bar looser than the type threshold", () => {
    expect(EMPTY_CITY_LISTING_NOINDEX_MAX).toBeLessThan(LISTING_DEAL_TYPE_NOINDEX_THRESHOLD);
  });
});

describe("national deal/type threshold", () => {
  it("is derived from the registry's city + type minimum, not a second number", () => {
    expect(LISTING_DEAL_TYPE_NOINDEX_THRESHOLD).toBe(SEO_PAGE_POLICY.cityType.minInventory - 1);
  });
});
