/**
 * Shared listing route resolution / normalization (Step 2).
 *
 * Canonical listing URLs should go through `buildListingUrl` from `./listingRoutes` (or the thin
 * helpers in this file that delegate to it). Exceptions are documented next to the code (e.g. country
 * hub paths, property redirects).
 *
 * Sanity/CMS calls stay in route `page.tsx` files or are passed in as inputs; this module only
 * imports `@/lib/sanity/client` for `resolveTopLevelListingSegment` (slug disambiguation).
 */

// =============================================================================
// Shared types & search-param helpers
// =============================================================================

import type { ParsedCatalogFilters } from "@/lib/catalog/parseCatalogFilters";
import {
  fetchCatalogCountryDocumentSlugs,
  fetchCatalogFilterOptions,
} from "@/lib/sanity/client";
import {
  dealQueryValueToRouteSegment,
  dealRouteSegmentToQueryValue,
} from "./catalogPathPrimitives";
import { isReservedFilterCountrySegment } from "./catalog";
import { buildListingUrl } from "./listingRoutes";
import type { ListingScope } from "./listingRoutes";

export type ListingSearchParams = Record<string, string | string[] | undefined>;

/** Normalized state aligned with `BuildListingUrlInput` / product filters (query values where applicable). */
export type NormalizedListingRouteState = {
  locale: string;
  scope: ListingScope;
  agentSlug?: string;
  country?: string;
  city?: string;
  /** Catalog deal filter: sale | rent | short-term */
  dealQuery?: string;
  propertyType?: string;
  district?: string;
};

export function normalizeListingPathSegment(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
}

/** Merge path-implied deal/type into search params (for metadata / listing). */
export function mergeListingSearchParams(
  search: ListingSearchParams,
  dealSegment?: string,
  propertyType?: string
): ListingSearchParams {
  const merged: ListingSearchParams = { ...search };
  const deal = dealSegment ? dealRouteSegmentToQueryValue(dealSegment) : "";
  if (deal) merged.deal = deal;
  if (propertyType) merged.type = propertyType;
  return merged;
}

/** Serialize query string from search, excluding listed keys (string values only; matches legacy pages). */
export function buildListingQueryString(search: ListingSearchParams, exclude: string[]): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (exclude.includes(k)) continue;
    if (typeof v === "string") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function pickSearchParamsExcluding(
  search: ListingSearchParams | URLSearchParams,
  exclude: string[]
): URLSearchParams {
  const params = new URLSearchParams();
  if (search instanceof URLSearchParams) {
    search.forEach((v, k) => {
      if (exclude.includes(k)) return;
      params.set(k, v);
    });
    return params;
  }
  for (const [k, v] of Object.entries(search)) {
    if (exclude.includes(k)) continue;
    if (typeof v === "string") params.set(k, v);
  }
  return params;
}

// =============================================================================
// Path segments after geo: `.../[country]/[city]/[[...filters]]` or agent: `.../agent/.../[country]/[city]/[[...filters]]`
// =============================================================================

/**
 * Parses optional `[[...filters]]` segments (deal and/or property type in the path).
 *
 * **Why `geoCity` and `agentCity` differ (product / routing constraint, not a bug):**
 *
 * - **geoCity** (catalog under a real country + city): a single segment may be either a **deal**
 *   segment (`sale`, `rent`, …) **or** a **property-type** slug, because the city is already fixed in
 *   the path. That supports shorthand URLs like `/{locale}/{country}/{city}/apartment`.
 *
 * - **agentCity** (agent listing under country + city): the path **must** include a **deal** before
 *   a type can appear in a second segment. A lone segment cannot be type-only: without country+city,
 *   putting only a type or only a deal in the path would mirror unsafe/non-canonical shapes; for
 *   agents we require deal when filters are present so we never emit ambiguous `…/agent/…/{type}` paths
 *   that skip deal or geo context. Deal/type without full geo stay query-only on the agent root
 *   (see Step 1 builder rules).
 */
export function resolveListingPathFilters(
  filters: string[],
  propertyTypeOptions: { value: string }[],
  mode: "geoCity" | "agentCity"
): { dealType: string; propertyType: string; dealQuery: string } | null {
  if (filters.length > 2) return null;
  const first = normalizeListingPathSegment(filters[0]);
  const second = normalizeListingPathSegment(filters[1]);
  const firstDeal = dealRouteSegmentToQueryValue(first || undefined);
  const secondDeal = dealRouteSegmentToQueryValue(second || undefined);

  if (filters.length === 0) {
    return { dealType: "", propertyType: "", dealQuery: "" };
  }

  if (filters.length === 1) {
    if (mode === "agentCity") {
      if (!firstDeal) return null;
      return { dealType: first, propertyType: "", dealQuery: firstDeal };
    }
    if (firstDeal) return { dealType: first, propertyType: "", dealQuery: firstDeal };
    const knownType = propertyTypeOptions.some((t) => normalizeListingPathSegment(t.value) === first);
    if (!knownType) return null;
    return { dealType: "", propertyType: first, dealQuery: "" };
  }

  if (!firstDeal || secondDeal) return null;
  const knownType = propertyTypeOptions.some((t) => normalizeListingPathSegment(t.value) === second);
  if (!knownType) return null;
  return { dealType: first, propertyType: second, dealQuery: firstDeal };
}

// =============================================================================
// Canonical listing URLs (delegate to `buildListingUrl`)
// =============================================================================

/** Canonical catalog geo URL via `buildListingUrl`. */
export function canonicalCatalogGeoListingHref(input: {
  locale: string;
  countrySlug: string;
  citySlug: string;
  dealTypeSegment: string;
  propertyType: string;
  district?: string;
  query: ListingSearchParams | URLSearchParams;
  queryExcludeKeys: string[];
}): string {
  const dealQuery = input.dealTypeSegment
    ? dealRouteSegmentToQueryValue(input.dealTypeSegment)
    : "";
  return buildListingUrl({
    scope: "catalog",
    locale: input.locale,
    country: input.countrySlug,
    city: input.citySlug,
    dealQuery: dealQuery || undefined,
    propertyType: input.propertyType || undefined,
    district: input.district,
    query: pickSearchParamsExcluding(input.query, input.queryExcludeKeys),
  });
}

/** Canonical agent geo URL via `buildListingUrl`. */
export function canonicalAgentGeoListingHref(input: {
  locale: string;
  agentSlug: string;
  country: string;
  citySlug: string;
  dealTypeSegment: string;
  propertyType: string;
  district?: string;
  query: ListingSearchParams | URLSearchParams;
  queryExcludeKeys: string[];
}): string {
  const dealQuery = input.dealTypeSegment
    ? dealRouteSegmentToQueryValue(input.dealTypeSegment)
    : "";
  return buildListingUrl({
    scope: "agent",
    locale: input.locale,
    agentSlug: input.agentSlug,
    country: input.country,
    city: input.citySlug,
    dealQuery: dealQuery || undefined,
    propertyType: input.propertyType || undefined,
    district: input.district,
    query: pickSearchParamsExcluding(input.query, input.queryExcludeKeys),
  });
}

/**
 * Canonical pathname for non-geo deal listing routes (`/sale`, `/rent`, `/short-term-rent` + optional type).
 * Same output as `nonGeoDealListingPath` from primitives, but routed through `buildListingUrl`.
 */
export function canonicalNonGeoDealListingPath(
  locale: string,
  dealQuery: "sale" | "rent" | "short-term",
  propertyTypeSlug?: string
): string {
  return buildListingUrl({
    scope: "catalog",
    locale,
    dealQuery,
    propertyType: propertyTypeSlug?.trim() || undefined,
  });
}

// =============================================================================
// Geo catalog: duplicate query / district redirects
// =============================================================================

/**
 * When `deal` / `type` duplicate path-encoded facets, redirect to strip redundant query keys.
 */
export function getGeoListingDuplicateFacetRedirectUrl(opts: {
  locale: string;
  countrySlug: string;
  citySlug: string;
  dealType: string;
  propertyType: string;
  dealQuery: string;
  search: ListingSearchParams;
}): string | null {
  const hasDuplicateDeal =
    typeof opts.search.deal === "string" &&
    normalizeListingPathSegment(opts.search.deal) === (opts.dealQuery || "");
  const hasDuplicateType =
    typeof opts.search.type === "string" &&
    normalizeListingPathSegment(opts.search.type) === (opts.propertyType || "");
  if (!hasDuplicateDeal && !hasDuplicateType) return null;
  const merged = mergeListingSearchParams(opts.search, opts.dealType || undefined, opts.propertyType || undefined);
  const district =
    typeof merged.district === "string" ? normalizeListingPathSegment(merged.district) : undefined;
  return canonicalCatalogGeoListingHref({
    locale: opts.locale,
    countrySlug: opts.countrySlug,
    citySlug: opts.citySlug,
    dealTypeSegment: opts.dealType,
    propertyType: opts.propertyType,
    district,
    query: merged,
    queryExcludeKeys: ["deal", "type", "city"],
  });
}

/** Normalize district in query when path + `catalogFilterPath` canonicalize casing. */
export function getGeoListingDistrictNormalizeRedirectUrl(opts: {
  locale: string;
  countrySlug: string;
  citySlug: string;
  dealType: string;
  propertyType: string;
  /** Original `searchParams` from the request. */
  rawSearch: ListingSearchParams;
  /** After merging path-implied `deal` / `type`. */
  mergedSearch: ListingSearchParams;
}): string | null {
  const district =
    typeof opts.mergedSearch.district === "string"
      ? normalizeListingPathSegment(opts.mergedSearch.district)
      : "";
  if (!district) return null;
  if (normalizeListingPathSegment(opts.rawSearch.district as string) === district) return null;
  return canonicalCatalogGeoListingHref({
    locale: opts.locale,
    countrySlug: opts.countrySlug,
    citySlug: opts.citySlug,
    dealTypeSegment: opts.dealType,
    propertyType: opts.propertyType,
    district,
    query: opts.mergedSearch,
    queryExcludeKeys: ["district"],
  });
}

// =============================================================================
// `/catalog` query-only redirects
// =============================================================================

/**
 * `/catalog` query-only redirects → canonical listing paths (uses `buildListingUrl` / builder rules).
 */
export function getCatalogRootRedirectUrl(
  locale: string,
  search: ListingSearchParams,
  parsed: ParsedCatalogFilters
): string | null {
  const cityQ = parsed.city;
  const dealSeg = dealQueryValueToRouteSegment(parsed.deal || undefined);
  const typeQ = parsed.type || "";
  const singleShorthandCount =
    Number(Boolean(cityQ)) + Number(Boolean(dealSeg)) + Number(Boolean(typeQ));

  if (cityQ) {
    return buildListingUrl({
      scope: "catalog",
      locale,
      city: cityQ,
      district: parsed.district || undefined,
      query: pickSearchParamsExcluding(search, ["city", "district"]),
    });
  }

  if (dealSeg && typeQ) {
    return buildListingUrl({
      scope: "catalog",
      locale,
      dealQuery: parsed.deal || undefined,
      propertyType: typeQ,
      query: pickSearchParamsExcluding(search, ["deal", "type", "city"]),
    });
  }

  if (singleShorthandCount === 1) {
    const dealQueryForBuilder = dealSeg ? dealRouteSegmentToQueryValue(dealSeg) : undefined;
    return buildListingUrl({
      scope: "catalog",
      locale,
      city: cityQ || undefined,
      dealQuery: dealQueryForBuilder,
      propertyType: typeQ || undefined,
      query: pickSearchParamsExcluding(search, ["city", "deal", "type"]),
    });
  }

  return null;
}

// =============================================================================
// Non-geo deal routes: query vs path canonicalization
// =============================================================================

export type NonGeoDealRedirectContext = {
  locale: string;
  dealRouteSegment: "sale" | "rent" | "short-term-rent";
  dealQuery: string;
  propertyTypeFromPath: string;
  search: ListingSearchParams;
};

/**
 * Non-geo deal routes: canonicalize `?type=` vs path segment (builder-backed path).
 */
export function getNonGeoDealListingRedirectUrl(ctx: NonGeoDealRedirectContext): string | null {
  const { locale, dealQuery, propertyTypeFromPath, search } = ctx;

  if (!propertyTypeFromPath) {
    const typeQ = typeof search.type === "string" ? search.type.trim() : "";
    if (!typeQ) return null;
    return buildListingUrl({
      scope: "catalog",
      locale,
      dealQuery,
      propertyType: typeQ,
      query: pickSearchParamsExcluding(search, ["type", "deal"]),
    });
  }

  const typeQ = typeof search.type === "string" ? search.type.trim() : "";
  if (!typeQ) return null;
  const nPath = normalizeListingPathSegment(propertyTypeFromPath);
  const nQ = normalizeListingPathSegment(typeQ);
  if (nQ !== nPath) {
    return buildListingUrl({
      scope: "catalog",
      locale,
      dealQuery,
      propertyType: propertyTypeFromPath,
      query: pickSearchParamsExcluding(search, ["type", "deal"]),
    });
  }
  return buildListingUrl({
    scope: "catalog",
    locale,
    dealQuery,
    propertyType: propertyTypeFromPath,
    query: pickSearchParamsExcluding(search, ["type"]),
  });
}

// =============================================================================
// Agent geo: promote query → path, district normalization
// =============================================================================

/** Agent geo: `?deal=` / `?type=` → path when `[...filters]` is empty (legacy). */
export function getAgentGeoPromoteQueryToPathRedirect(opts: {
  locale: string;
  agentSlug: string;
  country: string;
  citySlug: string;
  search: ListingSearchParams;
  propertyTypeOptions: { value: string }[];
}): string | null {
  const dealQ = typeof opts.search.deal === "string" ? opts.search.deal.trim() : "";
  if (!dealQ) return null;
  const dealSeg = dealQueryValueToRouteSegment(dealQ);
  if (!dealSeg) return null;
  let typeSeg: string | undefined;
  const typeQ = typeof opts.search.type === "string" ? opts.search.type.trim() : "";
  if (typeQ) {
    const normalized = normalizeListingPathSegment(typeQ);
    const known = opts.propertyTypeOptions.some(
      (t) => normalizeListingPathSegment(t.value) === normalized
    );
    if (known) typeSeg = normalized;
  }
  return canonicalAgentGeoListingHref({
    locale: opts.locale,
    agentSlug: opts.agentSlug,
    country: opts.country,
    citySlug: opts.citySlug,
    dealTypeSegment: dealSeg,
    propertyType: typeSeg || "",
    query: pickSearchParamsExcluding(opts.search, ["deal", "type"]),
    queryExcludeKeys: ["deal", "type"],
  });
}

/** Agent geo: one path segment (deal) + `?type=` → merge type into path. */
export function getAgentGeoPromoteTypeQueryToPathRedirect(opts: {
  locale: string;
  agentSlug: string;
  country: string;
  citySlug: string;
  dealTypeSegment: string;
  search: ListingSearchParams;
  propertyTypeOptions: { value: string }[];
}): string | null {
  const typeQ = typeof opts.search.type === "string" ? opts.search.type.trim() : "";
  if (!typeQ) return null;
  const typeSeg = normalizeListingPathSegment(typeQ);
  const known = opts.propertyTypeOptions.some((t) => normalizeListingPathSegment(t.value) === typeSeg);
  if (!known) return null;
  return canonicalAgentGeoListingHref({
    locale: opts.locale,
    agentSlug: opts.agentSlug,
    country: opts.country,
    citySlug: opts.citySlug,
    dealTypeSegment: opts.dealTypeSegment,
    propertyType: typeSeg,
    query: pickSearchParamsExcluding(opts.search, ["type"]),
    queryExcludeKeys: ["type"],
  });
}

/** District query normalization after `parseCatalogFilters`. */
export function getAgentGeoDistrictNormalizeRedirect(opts: {
  locale: string;
  agentSlug: string;
  country: string;
  citySlug: string;
  dealType: string;
  propertyType: string;
  search: ListingSearchParams;
  parsedDistrict: string;
}): string | null {
  const { parsedDistrict, search } = opts;
  if (!parsedDistrict) return null;
  if (normalizeListingPathSegment(search.district as string) === parsedDistrict) return null;
  return canonicalAgentGeoListingHref({
    locale: opts.locale,
    agentSlug: opts.agentSlug,
    country: opts.country,
    citySlug: opts.citySlug,
    dealTypeSegment: opts.dealType,
    propertyType: opts.propertyType,
    district: parsedDistrict,
    query: mergeListingSearchParams(search, opts.dealType || undefined, opts.propertyType || undefined),
    queryExcludeKeys: ["district"],
  });
}

// =============================================================================
// Top-level `/{locale}/[country]` segment (country hub vs deal vs type vs city; uses Sanity)
// =============================================================================

export type TopLevelResolvedKind = "deal" | "type" | "city" | "country";
export type TopLevelResolvedResult =
  | { kind: TopLevelResolvedKind; slug: string; merged: Record<string, string> }
  | { kind: "ambiguous"; slug: string; matches: Array<Exclude<TopLevelResolvedKind, "country">> };

const SINGLE_SEGMENT_RESOLUTION_ORDER: Array<Exclude<TopLevelResolvedKind, "country">> = [
  "deal",
  "type",
  "city",
];

function normalizeTopLevel(value?: string): string {
  if (typeof value !== "string") return "";
  return decodeURIComponent(value).trim().toLowerCase();
}

/**
 * Single dynamic segment under `/{locale}/[country]` — country hub vs deal vs type vs city vs ambiguous.
 * Product order: deal → type → city when multiple CMS groups match (see `SINGLE_SEGMENT_RESOLUTION_ORDER`).
 */
export async function resolveTopLevelListingSegment(
  locale: string,
  slugRaw: string
): Promise<TopLevelResolvedResult | null> {
  const slug = normalizeTopLevel(slugRaw);
  if (!slug || isReservedFilterCountrySegment(slug)) return null;
  const countrySlugs = await fetchCatalogCountryDocumentSlugs();
  if (countrySlugs.includes(slug)) return { kind: "country", slug, merged: {} };
  const options = await fetchCatalogFilterOptions(locale);
  const matches = {
    deal: Boolean(dealRouteSegmentToQueryValue(slug)),
    type: options.propertyTypes.some((t) => normalizeTopLevel(t.value) === slug),
    city: options.locations.some((c) => normalizeTopLevel(c.value) === slug),
  } as const;

  const matchingKinds = SINGLE_SEGMENT_RESOLUTION_ORDER.filter((kind) => matches[kind]);
  if (matchingKinds.length > 1) {
    return { kind: "ambiguous", slug, matches: matchingKinds };
  }
  if (matchingKinds.length === 0) return null;

  const resolvedKind = matchingKinds[0];
  if (resolvedKind === "deal")
    return { kind: "deal", slug, merged: { deal: dealRouteSegmentToQueryValue(slug) } };
  if (resolvedKind === "type") return { kind: "type", slug, merged: { type: slug } };
  if (resolvedKind === "city") return { kind: "city", slug, merged: { city: slug } };
  return null;
}

export function mergeTopLevelSearch(
  search: ListingSearchParams,
  resolved: { merged: Record<string, string | undefined> }
): ListingSearchParams {
  const next: ListingSearchParams = { ...search };
  for (const [key, value] of Object.entries(resolved.merged)) {
    if (typeof value === "string") next[key] = value;
  }
  return next;
}
