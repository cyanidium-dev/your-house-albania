/**
 * Catalog listing SEO helpers: when to noindex based on query (metadata only).
 * Does not change filter parsing or UI.
 *
 * Policy (listing/filter pages):
 * - `?page=N` (N ≥ 2) and nothing else but tracking parameters → a page of its
 *   own: canonical to itself (`<path>?page=N`), indexed exactly when the bare
 *   page is (audit M-2). See {@link listingPaginationPage}.
 * - Any other real query string on the URL → noindex; canonical is the path without `?…`.
 * - Deal + property-type URLs → also noindex when inventory is at or below
 *   `LISTING_DEAL_TYPE_NOINDEX_THRESHOLD` (same rule as geo listings + sitemap-types).
 */

import { fetchCatalogProperties } from "@/lib/sanity/client";
import { isNationalTypeListingThin } from "@/lib/seo/listingIndexPolicy";
import { isTrackingQueryParam } from "@/lib/routes/listingQueryRewrite";

export { LISTING_DEAL_TYPE_NOINDEX_THRESHOLD } from "@/lib/seo/listingIndexPolicy";

const DEFAULT_PAGE_SIZE = "24";
const DEFAULT_SORT = "recommended";

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

const LATER_PAGE = /^[1-9]\d*$/;

/**
 * The page number when the query names a later page and nothing else:
 * `?page=2` → 2, `?page=2&utm_source=x` → 2 (tracking parameters change
 * nothing on the page). `null` for page one, for no query, and whenever any
 * other parameter is present (`?page=2&sort=priceAsc` is a filtered copy).
 *
 * Such a page lists cards no other URL lists, so it is a page of its own:
 * self-canonical and as indexable as the bare listing. Pointing its canonical
 * at page one while also saying `noindex` (the rule until 2026-10-19) told
 * search engines to drop the only URLs linking listings 25 and later.
 * `?page=1`, `?page=0` and `?page=abc` never get here: the middleware 308s
 * them to the bare URL (`lib/routes/pageParam`).
 */
export function listingPaginationPage(
  searchParams: Record<string, string | string[] | undefined>
): number | null {
  let page: number | null = null;
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    const values = (Array.isArray(value) ? value : [value]).filter(
      (v): v is string => typeof v === "string" && v.trim() !== ""
    );
    if (values.length === 0) continue;
    if (isTrackingQueryParam(key)) continue;
    if (key !== "page" || values.length !== 1) return null;
    const raw = values[0].trim();
    if (!LATER_PAGE.test(raw)) return null;
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || n < 2) return null;
    page = n;
  }
  return page;
}

/** `?page=N` for a later page, `""` for page one — appended to a canonical or hreflang path. */
export function listingPageQuery(page: number | null | undefined): string {
  return page && page > 1 ? `?page=${page}` : "";
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
  return isNationalTypeListingThin(listing?.totalCount ?? 0);
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
