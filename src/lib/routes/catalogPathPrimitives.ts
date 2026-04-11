/**
 * Shared primitives for catalog/listing paths (no dependency on listing URL builder).
 * Kept separate so `listingRoutes.ts` and `catalog.ts` can both import without cycles.
 */

export const LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG = "albania";

export function normalizeCatalogCountrySlug(country?: string | null): string {
  const t = typeof country === "string" ? country.trim().toLowerCase() : "";
  return t || LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
}

export function allowsSingleSegmentCityListingPath(countryNormalized: string): boolean {
  return countryNormalized === LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
}

const DEAL_SEGMENT_TO_QUERY = {
  sale: "sale",
  rent: "rent",
  "short-term-rent": "short-term",
} as const;

export function dealRouteSegmentToQueryValue(segment?: string): string {
  if (!segment) return "";
  return DEAL_SEGMENT_TO_QUERY[segment as keyof typeof DEAL_SEGMENT_TO_QUERY] ?? "";
}

export function dealQueryValueToRouteSegment(deal?: string): string {
  if (deal === "short-term") return "short-term-rent";
  if (deal === "sale" || deal === "rent") return deal;
  return "";
}

export function nonGeoDealListingPath(
  locale: string,
  dealRouteSegment: string,
  propertyTypeSlug?: string | null
): string {
  const seg = dealRouteSegment.trim();
  let path = `/${locale}/${encodeURIComponent(seg)}`;
  const t = typeof propertyTypeSlug === "string" ? propertyTypeSlug.trim() : "";
  if (t) path += `/${encodeURIComponent(t)}`;
  return path;
}
