/**
 * Counting inventory for registry pages from raw property rows.
 *
 * The sitemap reads every public listing once and derives every candidate page
 * from it; the route counts one page at a time with `fetchCatalogListingStats`.
 * Both use the same predicates (`LISTING_FACETS[…].matches` mirrors the facet's
 * catalogue query), so a page is in the sitemap exactly when the route indexes it.
 *
 * Pure: callers fetch the rows (already limited to public sale listings).
 */
import { LISTING_FACETS, LISTING_FACET_SLUGS, type FacetPropertyRow } from "@/lib/catalog/listingFacets";
import { parentSeoPageKey, seoPageId } from "./registry";
import type { SeoPageInventory, SeoPageKey } from "./types";

export type SeoInventoryRow = FacetPropertyRow & {
  country: string;
  city: string;
  district?: string | null;
  lastModified: Date;
};

export type SeoPageCandidate = {
  key: SeoPageKey;
  inventory: SeoPageInventory;
  /** Newest `_updatedAt` among the page's listings. */
  lastModified: Date;
};

const norm = (value: string | null | undefined): string => (typeof value === "string" ? value.trim().toLowerCase() : "");

/** Whether a listing appears on the page. */
export function rowMatchesSeoPageKey(row: SeoInventoryRow, key: SeoPageKey): boolean {
  if (norm(row.country) !== key.country || norm(row.city) !== key.city) return false;
  const typeSlug = norm(row.typeSlug);
  switch (key.family) {
    case "city":
      return true;
    case "district":
      return norm(row.district) === key.district;
    case "cityType":
      return typeSlug === key.type;
    case "facet":
      if (key.district !== undefined && norm(row.district) !== key.district) return false;
      return LISTING_FACETS[key.facet].matches({ ...row, typeSlug });
  }
}

export function countSeoPageInventory(rows: readonly SeoInventoryRow[], key: SeoPageKey): number {
  return rows.reduce((n, row) => (rowMatchesSeoPageKey(row, key) ? n + 1 : n), 0);
}

/** The keys a single listing counts towards. */
function keysForRow(row: SeoInventoryRow): SeoPageKey[] {
  const country = norm(row.country);
  const city = norm(row.city);
  if (!country || !city) return [];
  const district = norm(row.district);
  const type = norm(row.typeSlug);
  const keys: SeoPageKey[] = [{ family: "city", country, city }];
  if (district) keys.push({ family: "district", country, city, district });
  if (type) keys.push({ family: "cityType", country, city, type });
  for (const facet of LISTING_FACET_SLUGS) {
    if (!LISTING_FACETS[facet].matches({ ...row, typeSlug: type })) continue;
    keys.push({ family: "facet", country, city, facet });
    if (district) keys.push({ family: "facet", country, city, district, facet });
  }
  return keys;
}

/**
 * Every page that has at least one listing, with its count, its parent's count
 * and its last modification. Pages with no listings are not candidates at all
 * (DO NOT GENERATE).
 */
export function collectSeoPageCandidates(rows: readonly SeoInventoryRow[]): SeoPageCandidate[] {
  const byId = new Map<string, { key: SeoPageKey; count: number; lastModified: Date }>();
  for (const row of rows) {
    for (const key of keysForRow(row)) {
      const id = seoPageId(key);
      const prev = byId.get(id);
      if (!prev) byId.set(id, { key, count: 1, lastModified: row.lastModified });
      else {
        prev.count += 1;
        if (row.lastModified > prev.lastModified) prev.lastModified = row.lastModified;
      }
    }
  }
  return Array.from(byId.values()).map(({ key, count, lastModified }) => {
    const parent = parentSeoPageKey(key);
    const parentCount = parent ? (byId.get(seoPageId(parent))?.count ?? null) : null;
    return { key, inventory: { count, parentCount }, lastModified };
  });
}
