// Canonical geo shorthand routes currently target a single default country.
// This is intentional frontend routing behavior (not CMS-driven country discovery).
export const DEFAULT_FILTER_COUNTRY_SLUG = "albania";

export function getCatalogCountrySlug(): string {
  return DEFAULT_FILTER_COUNTRY_SLUG;
}

/**
 * Single-country guardrail:
 * until multi-country routing is introduced, normalize any provided country
 * to the canonical slug so route builders remain deterministic.
 */
export function normalizeCatalogCountrySlug(country?: string): string {
  void country;
  return DEFAULT_FILTER_COUNTRY_SLUG;
}

export const FILTER_ROUTE_RESERVED_SEGMENTS = new Set([
  "catalog",
  "country",
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

export function isReservedFilterCountrySegment(segment?: string): boolean {
  if (!segment) return true;
  return FILTER_ROUTE_RESERVED_SEGMENTS.has(segment.toLowerCase());
}

type CatalogFilterPathInput = {
  locale: string;
  country?: string;
  city?: string;
  dealType?: string;
  propertyType?: string;
  district?: string;
};

type AgentFilterPathInput = {
  locale: string;
  agentSlug: string;
  city?: string;
  dealType?: string;
  propertyType?: string;
  district?: string;
};

type SingleFilterInput = {
  locale: string;
  city?: string;
  dealType?: string;
  propertyType?: string;
};

export function singleFilterPath({
  locale,
  city,
  dealType,
  propertyType,
}: SingleFilterInput): string {
  if (city) return `/${locale}/${encodeURIComponent(city)}`;
  if (dealType) return `/${locale}/${encodeURIComponent(dealType)}`;
  if (propertyType) return `/${locale}/${encodeURIComponent(propertyType)}`;
  return `/${locale}/catalog`;
}

export function catalogFilterPath({
  locale,
  country = DEFAULT_FILTER_COUNTRY_SLUG,
  city,
  dealType,
  propertyType,
  district,
}: CatalogFilterPathInput): string {
  const normalizedCountry = normalizeCatalogCountrySlug(country);
  const encodedCountry = encodeURIComponent(normalizedCountry);
  if (!city) return `/${locale}/catalog`;
  if (!dealType && !propertyType && normalizedCountry === DEFAULT_FILTER_COUNTRY_SLUG) {
    return singleFilterPath({ locale, city });
  }
  const encodedCity = encodeURIComponent(city);
  let path = `/${locale}/${encodedCountry}/${encodedCity}`;
  if (dealType) path += `/${encodeURIComponent(dealType)}`;
  if (propertyType) path += `/${encodeURIComponent(propertyType)}`;
  if (district) path += `?district=${encodeURIComponent(district)}`;
  return path;
}

export function agentFilterPath({
  locale,
  agentSlug,
  city,
  dealType,
  propertyType,
  district,
}: AgentFilterPathInput): string {
  let path = `/${locale}/agent/${encodeURIComponent(agentSlug)}`;
  if (city) path += `/${encodeURIComponent(city)}`;
  if (dealType) path += `/${encodeURIComponent(dealType)}`;
  if (propertyType) path += `/${encodeURIComponent(propertyType)}`;
  if (district) path += `?district=${encodeURIComponent(district)}`;
  return path;
}

/**
 * Backward-compatible helper used across existing UI.
 * - root: /[locale]/catalog
 * - city catalog: /[locale]/[country]/[city]
 * - agent listing remains under /[locale]/agent/...
 * - district remains query param for catalog pages
 */
export function catalogPath(locale: string, city?: string, district?: string, agentSlug?: string): string {
  const base = `/${locale}/catalog`;
  const hasAgent = Boolean(agentSlug && agentSlug.trim());
  if (hasAgent) {
    return agentFilterPath({
      locale,
      agentSlug: agentSlug!,
      city,
      district,
    });
  }
  if (!city) {
    if (district) return `${base}?district=${encodeURIComponent(district)}`;
    return base;
  }
  return catalogFilterPath({ locale, city, district });
}
