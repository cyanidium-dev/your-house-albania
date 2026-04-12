/**
 * Shared primitives for catalog/listing paths (no dependency on listing URL builder).
 * Kept separate so `listingRoutes.ts` and `catalog.ts` can both import without cycles.
 */

export const LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG = "albania";

export function normalizeCatalogCountrySlug(country?: string | null): string {
  const t = typeof country === "string" ? country.trim().toLowerCase() : "";
  return t || LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
}

/** Resolved path segments for catalog/agent geo URLs (sync; no I/O). */
export type EffectiveListingCountry = { countryRaw: string; countryNorm: string };

/**
 * When `city` is set, prefers `trustedCityCountrySlug` (CMS / locations) over `country`, so wrong
 * explicit country cannot override the city’s country.
 *
 * When `city` is set but neither trusted nor explicit country is available, returns **empty**
 * `countryRaw` / `countryNorm` so path builders emit **`/{locale}/{city}/…`** (path-based “omit country”
 * shape) — never a fake country segment and never `/catalog?city=…` for city listings.
 *
 * When `city` is absent, `country` is optional and falls back to Albania only via
 * `normalizeCatalogCountrySlug` (non-geo default country).
 */
export function resolveEffectiveCountryForListingBuild(input: {
  city?: string | null;
  country?: string | null;
  /** Authoritative when set (e.g. `locations[].countrySlug`, `fetchCityCountrySlugByCitySlug`). */
  trustedCityCountrySlug?: string | null;
}): EffectiveListingCountry {
  const city = typeof input.city === "string" ? input.city.trim() : "";
  const trusted =
    typeof input.trustedCityCountrySlug === "string" && input.trustedCityCountrySlug.trim()
      ? input.trustedCityCountrySlug.trim().toLowerCase()
      : "";
  const explicit = typeof input.country === "string" ? input.country.trim() : "";

  if (!city) {
    return {
      countryRaw: explicit,
      countryNorm: normalizeCatalogCountrySlug(explicit || undefined),
    };
  }

  if (trusted) {
    return { countryRaw: trusted, countryNorm: trusted };
  }

  if (explicit) {
    const n = explicit.toLowerCase();
    return { countryRaw: explicit, countryNorm: n };
  }

  return { countryRaw: "", countryNorm: "" };
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
