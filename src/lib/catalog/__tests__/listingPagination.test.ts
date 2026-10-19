import { describe, expect, it } from "vitest";
import {
  CATALOG_PAGE_SIZE,
  catalogPageIndex,
  catalogPageLinkTargets,
  catalogPageOf,
  catalogTotalPages,
  catalogueClickDepths,
  type CatalogueHub,
} from "../listingPagination";

describe("catalogue page index", () => {
  it("counts pages of 24", () => {
    expect(catalogTotalPages(0)).toBe(1);
    expect(catalogTotalPages(24)).toBe(1);
    expect(catalogTotalPages(25)).toBe(2);
    expect(catalogTotalPages(727)).toBe(31);
    expect(catalogPageOf(0)).toBe(1);
    expect(catalogPageOf(23)).toBe(1);
    expect(catalogPageOf(24)).toBe(2);
  });

  it("lists every page and marks the current one", () => {
    expect(catalogPageIndex(1, 1)).toEqual([]);
    expect(catalogPageIndex(2, 3)).toEqual([
      { page: 1, current: false },
      { page: 2, current: true },
      { page: 3, current: false },
    ]);
    const index = catalogPageIndex(1, 31);
    expect(index).toHaveLength(31);
    expect(index.map((e) => e.page)).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it("links from each page to every other page", () => {
    expect(catalogPageLinkTargets(1, 4)).toEqual([2, 3, 4]);
    expect(catalogPageLinkTargets(3, 4)).toEqual([1, 2, 4]);
    // Out-of-range input clamps instead of inventing pages.
    expect(catalogPageLinkTargets(9, 3)).toEqual([1, 2]);
  });
});

/** A synthetic country: cities with districts, some listings with no district. */
function syntheticInventory(spec: Record<string, { districts: Record<string, number>; noDistrict: number; banners?: number }>) {
  const hubs: CatalogueHub[] = [];
  const cityOf = new Map<string, string>();
  for (const [city, { districts, noDistrict, banners = 0 }] of Object.entries(spec)) {
    const cityListings: string[] = [];
    const childHubIds: string[] = [];
    for (const [district, count] of Object.entries(districts)) {
      const ids = Array.from({ length: count }, (_, i) => `${city}/${district}/${i}`);
      cityListings.push(...ids);
      // A district hub pages through its own listings.
      hubs.push({ id: `${city}/${district}`, listingIds: ids });
      childHubIds.push(`${city}/${district}`);
    }
    cityListings.push(...Array.from({ length: noDistrict }, (_, i) => `${city}/-/${i}`));
    // Banners sit outside the paged list and show on every page.
    const pinned = cityListings.splice(0, banners);
    // The city lists every listing of the city, newest first: interleave so
    // district listings are spread over all pages, as in production.
    cityListings.sort((a, b) => a.split("/")[2].localeCompare(b.split("/")[2]) || a.localeCompare(b));
    hubs.push({ id: city, listingIds: cityListings, pinnedListingIds: pinned, childHubIds });
    for (const id of [...cityListings, ...pinned]) cityOf.set(id, city);
  }
  return { hubs, cityOf };
}

describe("catalogueClickDepths", () => {
  const { hubs, cityOf } = syntheticInventory({
    // Durrës-sized: 560 listings, 24 pages, one district alone over 20 pages.
    durres: { districts: { golem: 500, plazh: 40, shkozet: 3 }, noDistrict: 17, banners: 2 },
    vlore: { districts: { lungomare: 120 }, noDistrict: 90 },
    shengjin: { districts: {}, noDistrict: 7 },
  });

  it("puts every listing within three clicks of its city hub", () => {
    const cities = [...new Set(cityOf.values())];
    for (const city of cities) {
      const depths = catalogueClickDepths(city, hubs);
      const own = [...cityOf.entries()].filter(([, c]) => c === city).map(([id]) => id);
      for (const id of own) {
        const depth = depths.get(id);
        expect(depth, `${id} unreachable from ${city}`).toBeDefined();
        expect(depth!, `${id} from ${city}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it("reaches a listing without a district as city → page N → listing", () => {
    const depths = catalogueClickDepths("durres", hubs);
    const durres = hubs.find((h) => h.id === "durres")!;
    const last = durres.listingIds[durres.listingIds.length - 1];
    expect(catalogTotalPages(durres.listingIds.length)).toBeGreaterThan(20);
    // The last card of the last page: two clicks.
    expect(depths.get(last)).toBe(2);
    for (const id of durres.listingIds.filter((x) => x.startsWith("durres/-/"))) {
      expect(depths.get(id)!).toBeLessThanOrEqual(2);
    }
  });

  it("reaches district listings within three clicks from a district-only path", () => {
    // Without the city's own pages: city page 1 → district → page N → listing.
    const districtOnly = hubs.map((h) => (h.id === "durres" ? { ...h, listingIds: h.listingIds.slice(0, CATALOG_PAGE_SIZE) } : h));
    const depths = catalogueClickDepths("durres", districtOnly);
    const golem = hubs.find((h) => h.id === "durres/golem")!;
    for (const id of golem.listingIds) expect(depths.get(id)!).toBeLessThanOrEqual(3);
  });

  it("puts banners one click from every page", () => {
    const depths = catalogueClickDepths("durres", hubs);
    const durres = hubs.find((h) => h.id === "durres")!;
    for (const id of durres.pinnedListingIds ?? []) expect(depths.get(id)).toBe(1);
  });

  it("follows the links the index renders, nothing more", () => {
    // Page N linked only from page N-1 (the old next-link chain) is what this
    // replaces: the walk finds the last page of a 24-page city in one click.
    const durres = hubs.find((h) => h.id === "durres")!;
    const totalPages = catalogTotalPages(durres.listingIds.length);
    expect(catalogPageLinkTargets(1, totalPages)).toContain(totalPages);
  });
});
