/**
 * Unified listing URL construction for catalog + agent (builder only; no route resolution).
 *
 * ## Path vs URL
 * - **`buildListingPath`** — pathname only (no `?`). Ignores `district` for the path; district is a
 *   **query-only** facet on catalog listings (`/{locale}/catalog?district=…` or geo paths with `?district=`).
 * - **`buildListingUrl`** — pathname + merged query. Use this whenever the browser needs a full `href`.
 *
 * ## Agent without city (`/{locale}/agent/{slug}` only)
 * Deal and property type **must not** appear as extra path segments without geo (`…/agent/…/rent` is unsafe /
 * unsupported). When `scope === "agent"` and `city` is empty, the pathname stays the agent root; any
 * `dealQuery` / `propertyType` are written to **`deal`** / **`type`** query params (and are not stripped,
 * since they are not represented in the path). This is intentional, not accidental.
 *
 * ## Catalog path segments
 * Geo listings with a **city** use `resolveEffectiveCountryForListingBuild`. If country is known
 * (trusted or explicit), pathname is `/{locale}/{country}/{city}/…`. If country is unknown, pathname is
 * path-based **`/{locale}/{city}/…`** (and deal/type in subsequent segments / catch-all per route shape)
 * — **not** `/catalog?city=…`. Albania fallback applies only when **no city** is in the input.
 */

import {
  dealQueryValueToRouteSegment,
  nonGeoDealListingPath,
  resolveEffectiveCountryForListingBuild,
} from "./catalogPathPrimitives";

export type ListingScope = "catalog" | "agent";

/** Input for pathname-only builders. `district` is ignored for the path; use `buildListingUrl` for `?district=`. */
export type BuildListingPathInput = {
  locale: string;
  scope: ListingScope;
  /** Required when scope === "agent" */
  agentSlug?: string;
  country?: string | null;
  /** When set with `city`, wins over `country` (CMS / locations / server fetch). */
  trustedCityCountrySlug?: string | null;
  city?: string | null;
  /** Catalog filter value: `sale` | `rent` | `short-term` (not the URL segment for short-term rent). */
  dealQuery?: string | null;
  propertyType?: string | null;
  /** Used only by `buildListingUrl` (query param), not by `buildListingPath`. */
  district?: string | null;
};

/** Full `href`: pathname + merged `query` (non-path facets). Path-encoded keys are stripped from `query` when redundant. */
export type BuildListingUrlInput = BuildListingPathInput & {
  query?: URLSearchParams | null;
};

function pathIncludesSegment(path: string, segment: string): boolean {
  if (!segment) return false;
  return path.includes(`/${encodeURIComponent(segment)}`);
}

function buildAgentPathname(
  locale: string,
  agentSlug: string | undefined,
  countryNorm: string,
  city: string,
  dealSeg: string,
  type: string
): string {
  const slug = agentSlug?.trim();
  if (!slug) return `/${locale}/catalog`;
  const base = `/${locale}/agent/${encodeURIComponent(slug)}`;
  if (!city) {
    return base;
  }
  if (!countryNorm) {
    return base;
  }
  let p = `${base}/${encodeURIComponent(countryNorm)}/${encodeURIComponent(city)}`;
  if (dealSeg) p += `/${encodeURIComponent(dealSeg)}`;
  if (type) p += `/${encodeURIComponent(type)}`;
  return p;
}

/**
 * Catalog scope pathname only. Single-segment shorthand rules live here (see block comment inside).
 */
function buildCatalogPathname(
  locale: string,
  countryRaw: string,
  countryNorm: string,
  city: string,
  dealSeg: string,
  type: string
): string {
  const hasCity = Boolean(city);
  const hasExplicitCountry = Boolean(countryRaw);

  /** Country hub: /[locale]/[country] — listing index for a country */
  if (hasExplicitCountry && !hasCity && !dealSeg && !type) {
    return `/${locale}/${encodeURIComponent(countryNorm)}`;
  }

  /** Plain catalog index (no geo, no deal, no type in path). */
  if (!hasCity && !dealSeg && !type) {
    return `/${locale}/catalog`;
  }

  /** Non-geo deal (+ optional type): /[locale]/[dealSegment]/… */
  if (!hasExplicitCountry && !hasCity && dealSeg) {
    return nonGeoDealListingPath(locale, dealSeg, type || undefined);
  }

  /**
   * City without a resolvable country (omit-country shape): `/{locale}/{city}/…` — never fake country,
   * never `/catalog?city=…`. Optional deal/type continue as path segments (route: first seg = city,
   * second = deal, catch-all = type).
   */
  if (hasCity && !countryNorm) {
    if (!dealSeg && !type) {
      return `/${locale}/${encodeURIComponent(city)}`;
    }
    let p = `/${locale}/${encodeURIComponent(city)}`;
    if (dealSeg) p += `/${encodeURIComponent(dealSeg)}`;
    if (type) p += `/${encodeURIComponent(type)}`;
    return p;
  }

  /**
   * Legacy single-segment shorthand (no country segment in input):
   * exactly one of city, deal segment, or property type becomes `/{locale}/{oneSegment}`.
   */
  const singleFacetCount =
    Number(Boolean(hasCity)) + Number(Boolean(dealSeg)) + Number(Boolean(type));
  if (!hasExplicitCountry && singleFacetCount === 1) {
    if (hasCity) return `/${locale}/${encodeURIComponent(city)}`;
    if (dealSeg) return `/${locale}/${encodeURIComponent(dealSeg)}`;
    if (type) return `/${locale}/${encodeURIComponent(type)}`;
  }

  if (hasCity) {
    let p = `/${locale}/${encodeURIComponent(countryNorm)}/${encodeURIComponent(city)}`;
    if (dealSeg) p += `/${encodeURIComponent(dealSeg)}`;
    if (type) p += `/${encodeURIComponent(type)}`;
    return p;
  }

  return `/${locale}/catalog`;
}

/**
 * Pathname only (no `?`). Does not encode `district`; use `buildListingUrl` for `?district=`.
 */
export function buildListingPath(input: BuildListingPathInput): string {
  const locale = input.locale;
  const city = input.city?.trim() || "";
  const { countryRaw, countryNorm } = resolveEffectiveCountryForListingBuild({
    city: city || undefined,
    country: input.country,
    trustedCityCountrySlug: input.trustedCityCountrySlug,
  });
  const dealSeg = dealQueryValueToRouteSegment(input.dealQuery?.trim() || undefined);
  const type = input.propertyType?.trim() || "";

  if (input.scope === "agent") {
    return buildAgentPathname(locale, input.agentSlug, countryNorm, city, dealSeg, type);
  }

  return buildCatalogPathname(locale, countryRaw, countryNorm, city, dealSeg, type);
}

/**
 * Full href: pathname + merged query string for non-path facets (`district`, pagination, sort, etc.).
 */
export function buildListingUrl(input: BuildListingUrlInput): string {
  const path = buildListingPath(input);
  const params = input.query ? new URLSearchParams(input.query.toString()) : new URLSearchParams();

  const citySlug = input.city?.trim() || "";
  const typeSlug = input.propertyType?.trim() || "";
  const dealSeg = dealQueryValueToRouteSegment(input.dealQuery?.trim() || undefined);
  const { countryRaw } = resolveEffectiveCountryForListingBuild({
    city: citySlug || undefined,
    country: input.country,
    trustedCityCountrySlug: input.trustedCityCountrySlug,
  });
  const hasCountryInPath =
    Boolean(input.country?.trim()) ||
    Boolean(input.trustedCityCountrySlug?.trim()) ||
    (Boolean(citySlug) && Boolean(countryRaw));

  if (citySlug && pathIncludesSegment(path, citySlug)) {
    params.delete("city");
  }
  if (dealSeg && pathIncludesSegment(path, dealSeg)) params.delete("deal");
  if (typeSlug && pathIncludesSegment(path, typeSlug)) params.delete("type");
  if (hasCountryInPath) params.delete("country");

  const agentRoot =
    input.scope === "agent" &&
    Boolean(input.agentSlug?.trim()) &&
    !input.city?.trim();
  if (agentRoot) {
    const dq = input.dealQuery?.trim();
    if (dq) params.set("deal", dq);
    const ts = input.propertyType?.trim();
    if (ts) params.set("type", ts);
  }

  if (input.district?.trim()) {
    params.set("district", input.district.trim());
  }

  const qs = params.toString();
  if (!qs) return path;
  return path.includes("?") ? `${path}&${qs}` : `${path}?${qs}`;
}
