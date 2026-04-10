/**
 * Catalog listing SEO helpers: when to noindex based on query (metadata only).
 * Does not change filter parsing or UI.
 */

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
