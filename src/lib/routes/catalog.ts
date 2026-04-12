/**
 * Catalog / listing route helpers.
 * URL construction is centralized in `./listingRoutes` (`buildListingPath` / `buildListingUrl`);
 * functions below delegate there while preserving existing export names.
 */

import {
  LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG,
  dealRouteSegmentToQueryValue,
  normalizeCatalogCountrySlug,
} from "./catalogPathPrimitives";
import {
  buildListingPath,
  buildListingUrl,
  type BuildListingPathInput,
  type BuildListingUrlInput,
  type ListingScope,
} from "./listingRoutes";

export {
  LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG,
  allowsSingleSegmentCityListingPath,
  dealQueryValueToRouteSegment,
  dealRouteSegmentToQueryValue,
  nonGeoDealListingPath,
  normalizeCatalogCountrySlug,
  resolveEffectiveCountryForListingBuild,
} from "./catalogPathPrimitives";

export type { BuildListingPathInput, BuildListingUrlInput, ListingScope };
export { buildListingPath, buildListingUrl } from "./listingRoutes";

/** @deprecated Use CMS-backed country slugs; kept for imports that still expect this name. */
export const DEFAULT_FILTER_COUNTRY_SLUG = LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;

/** Legacy middleware / redirects only: when the true country cannot be inferred. */
export function getLegacyFallbackCatalogCountrySlug(): string {
  return LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG;
}

export const FILTER_ROUTE_RESERVED_SEGMENTS = new Set([
  "catalog",
  "country",
  "info",
  "investment",
  "properties",
  "property",
  "agent",
  "about",
  "cities",
  "blog",
  "contact",
  "contacts",
  "contactus",
  "favorites",
  "register",
  "sell",
  "for-realtors",
  "how-to-publish",
  "appartment",
  "office-spaces",
  "residential-homes",
  "luxury-villa",
]);

export function isReservedFilterCountrySegment(segment?: string): boolean {
  if (!segment) return true;
  return FILTER_ROUTE_RESERVED_SEGMENTS.has(segment.toLowerCase());
}

type CatalogFilterPathInput = {
  locale: string;
  country?: string;
  /** When set with `city`, wins over `country` for the path segment. */
  trustedCityCountrySlug?: string;
  city?: string;
  dealType?: string;
  propertyType?: string;
  district?: string;
};

type AgentFilterPathInput = {
  locale: string;
  agentSlug: string;
  country?: string;
  trustedCityCountrySlug?: string;
  city?: string;
  dealType?: string;
  propertyType?: string;
  district?: string;
};

type SingleFilterInput = {
  locale: string;
  city?: string;
  country?: string;
  trustedCityCountrySlug?: string;
  dealType?: string;
  propertyType?: string;
};

type CanonicalCatalogUrlInput = {
  locale: string;
  city?: string;
  deal?: string;
  propertyType?: string;
  country?: string;
  trustedCityCountrySlug?: string;
  query?: URLSearchParams;
};

/** Maps legacy `dealType` route segments to `buildListingPath` `dealQuery` values. */
function dealTypeSegmentToListingDealQuery(dealType?: string): string | undefined {
  if (!dealType) return undefined;
  const q = dealRouteSegmentToQueryValue(String(dealType));
  return q || undefined;
}

/**
 * City editorial / info pages: `/{locale}/{country}/{city}/info`
 */
export function cityInfoPath(
  locale: string,
  citySlug: string,
  country?: string | null
): string {
  const c = normalizeCatalogCountrySlug(country);
  return `/${locale}/${encodeURIComponent(c)}/${encodeURIComponent(citySlug)}/info`;
}

export function singleFilterPath({
  locale,
  city,
  country,
  trustedCityCountrySlug,
  dealType,
  propertyType,
}: SingleFilterInput): string {
  return buildListingPath({
    scope: "catalog",
    locale,
    city,
    country,
    trustedCityCountrySlug,
    dealQuery: dealTypeSegmentToListingDealQuery(dealType),
    propertyType,
  });
}

export function catalogFilterPath({
  locale,
  country,
  trustedCityCountrySlug,
  city,
  dealType,
  propertyType,
  district,
}: CatalogFilterPathInput): string {
  return buildListingUrl({
    scope: "catalog",
    locale,
    country,
    trustedCityCountrySlug,
    city,
    dealQuery: dealTypeSegmentToListingDealQuery(dealType),
    propertyType,
    district,
  });
}

export function agentFilterPath({
  locale,
  agentSlug,
  country,
  trustedCityCountrySlug,
  city,
  dealType,
  propertyType,
  district,
}: AgentFilterPathInput): string {
  return buildListingUrl({
    scope: "agent",
    locale,
    agentSlug,
    country,
    trustedCityCountrySlug,
    city,
    dealQuery: dealTypeSegmentToListingDealQuery(dealType),
    propertyType,
    district,
  });
}

/**
 * Backward-compatible entry point; all branches delegate to `buildListingUrl`.
 * When there is no city, the path is `/{locale}/catalog` (+ optional `?district=`). `country` is ignored
 * in that case (legacy callers relied on this; do not pass country expecting a country hub here).
 */
export function catalogPath(
  locale: string,
  city?: string,
  district?: string,
  agentSlug?: string,
  country?: string
): string {
  if (agentSlug?.trim()) {
    return buildListingUrl({
      scope: "agent",
      locale,
      agentSlug,
      country,
      city,
      district,
    });
  }
  if (city?.trim()) {
    return buildListingUrl({
      scope: "catalog",
      locale,
      country,
      city,
      district,
    });
  }
  return buildListingUrl({
    scope: "catalog",
    locale,
    district,
  });
}

export function canonicalCatalogUrl({
  locale,
  city,
  deal,
  propertyType,
  country,
  trustedCityCountrySlug,
  query,
}: CanonicalCatalogUrlInput): string {
  return buildListingUrl({
    scope: "catalog",
    locale,
    country,
    trustedCityCountrySlug,
    city,
    dealQuery: deal?.trim() || undefined,
    propertyType,
    query,
  });
}
