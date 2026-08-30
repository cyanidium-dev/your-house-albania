import { describe, expect, it } from "vitest";
import {
  EMPTY_CITY_LISTING_NOINDEX_MAX,
  LISTING_DEAL_TYPE_NOINDEX_THRESHOLD,
  LISTING_DISTRICT_NOINDEX_THRESHOLD,
  shouldNoindexEmptyCityListing,
} from "../listingIndexPolicy";

describe("shouldNoindexEmptyCityListing", () => {
  it("drops a city with no properties", () => {
    expect(shouldNoindexEmptyCityListing(0)).toBe(true);
  });

  it("keeps a city that has even one property", () => {
    // The point of the zero threshold: Vlore (4), Sarande (6) and Shengjin (2)
    // stay indexed. Demoting them would cost four of seven cities.
    expect(shouldNoindexEmptyCityListing(1)).toBe(false);
    expect(shouldNoindexEmptyCityListing(2)).toBe(false);
    expect(shouldNoindexEmptyCityListing(6)).toBe(false);
    expect(shouldNoindexEmptyCityListing(23)).toBe(false);
  });

  it("treats a failed count as empty rather than assuming inventory", () => {
    expect(shouldNoindexEmptyCityListing(Number.NaN)).toBe(true);
    expect(shouldNoindexEmptyCityListing(Number.POSITIVE_INFINITY)).toBe(true);
  });

  it("treats a negative count as empty", () => {
    expect(shouldNoindexEmptyCityListing(-1)).toBe(true);
  });

  it("keeps the city bar looser than the combination-page thresholds", () => {
    expect(EMPTY_CITY_LISTING_NOINDEX_MAX).toBeLessThan(LISTING_DEAL_TYPE_NOINDEX_THRESHOLD);
    expect(EMPTY_CITY_LISTING_NOINDEX_MAX).toBeLessThan(LISTING_DISTRICT_NOINDEX_THRESHOLD);
  });
});
