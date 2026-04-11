/**
 * Catalog listing SEO helpers: when to noindex based on query (metadata only).
 * Does not change filter parsing or UI.
 *
 * Policy (listing/filter pages):
 * - Any real query string on the URL → noindex; canonical is always the path without `?…`.
 * - Deal + property-type URLs → also noindex when inventory is at or below
 *   `LISTING_DEAL_TYPE_NOINDEX_THRESHOLD` (same rule as geo listings + sitemap-types).
 */

import { fetchCatalogProperties } from "@/lib/sanity/client";
import { LISTING_DEAL_TYPE_NOINDEX_THRESHOLD } from "@/lib/seo/listingIndexPolicy";

export { LISTING_DEAL_TYPE_NOINDEX_THRESHOLD } from "@/lib/seo/listingIndexPolicy";

const DEFAULT_PAGE_SIZE = "24";
const DEFAULT_SORT = "newest";

function stringParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = searchParams[key];
  return typeof v === "string" ? v : undefined;
}

function isNonEmptyFilterValue(key: string, raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (key === "page" && trimmed === "1") return false;
  if (key === "sort" && trimmed === DEFAULT_SORT) return false;
  if (key === "pageSize" && trimmed === DEFAULT_PAGE_SIZE) return false;
  if (["minPrice", "maxPrice", "minArea", "maxArea", "beds"].includes(key) && trimmed === "0") {
    return false;
  }
  return true;
}

/**
 * True when the request has any query string (listing pages: always noindex; canonical = path-only).
 * Stricter than {@link shouldCatalogListingNoindex} (e.g. `?page=1` still counts as a query).
 */
export function listingUrlHasQueryParams(
  searchParams: Record<string, string | string[] | undefined>
): boolean {
  for (const value of Object.values(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.some((s) => typeof s === "string" && s.trim() !== "")) return true;
    } else if (typeof value === "string" && value.trim() !== "") {
      return true;
    }
  }
  return false;
}

/**
 * Non-geo national deal+type URLs: thin inventory → noindex (same threshold as geo + sitemap).
 */
export async function shouldNoindexNonGeoDealTypeCombo(
  dealQuery: "sale" | "rent" | "short-term",
  propertyTypeSlug: string
): Promise<boolean> {
  const slug = propertyTypeSlug.trim();
  if (!slug) return false;
  const listing = await fetchCatalogProperties({
    deal: dealQuery,
    type: slug,
    page: 1,
    pageSize: 1,
  });
  const totalCount = listing?.totalCount ?? 0;
  return totalCount <= LISTING_DEAL_TYPE_NOINDEX_THRESHOLD;
}

/**
 * Returns true when the listing should be noindexed: page > 1 or any active filter query.
 */
export function shouldCatalogListingNoindex(
  searchParams: Record<string, string | string[] | undefined>,
  options?: { ignoredQueryKeys?: string[] }
): boolean {
  const ignored = new Set((options?.ignoredQueryKeys ?? []).map((k) => k.trim()).filter(Boolean));
  const pageRaw = stringParam(searchParams, "page");
  const pageNum = pageRaw ? parseInt(pageRaw, 10) : 1;
  if (Number.isFinite(pageNum) && pageNum > 1) return true;

  const keys = [
    "city",
    "district",
    "agent",
    "type",
    "deal",
    "sort",
    "amenities",
    "pageSize",
    "minPrice",
    "maxPrice",
    "minArea",
    "maxArea",
    "beds",
  ] as const;

  for (const key of keys) {
    if (ignored.has(key)) continue;
    const v = searchParams[key];
    if (typeof v === "string" && isNonEmptyFilterValue(key, v)) return true;
    if (Array.isArray(v) && v.some((s) => typeof s === "string" && isNonEmptyFilterValue(key, s))) {
      return true;
    }
  }

  return false;
}
