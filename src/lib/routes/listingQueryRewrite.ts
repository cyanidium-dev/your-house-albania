/**
 * Which requests the middleware hands to the query-reading listing route.
 *
 * `/{locale}/{country}/{city}/[[...filters]]` is cached (ISR) and takes no
 * `searchParams`. A URL with a real query string is rewritten to the sibling
 * route `/{locale}/listing-query/{country}/{city}/…`, which reads the query and
 * renders the same tree per request. The browser URL does not change.
 *
 * Edge-safe: no imports, the middleware bundles this file.
 */

/** Internal segment of the query-reading route. Never appears in a link. */
export const LISTING_QUERY_SEGMENT = "listing-query";

/**
 * First path segments after the locale that are routes of their own — every
 * folder in `src/app/[locale]` except `[country]`. A test reads the directory
 * and fails when a new folder is missing here.
 */
export const NON_LISTING_FIRST_SEGMENTS: ReadonlySet<string> = new Set([
  LISTING_QUERY_SEGMENT,
  "about",
  "agent",
  "ai-search",
  "appartment",
  "blog",
  "catalog",
  "cities",
  "contact",
  "contacts",
  "contactus",
  "favorites",
  "for-realtors",
  "guides",
  "how-to-publish",
  "image-credits",
  "investment",
  "knowledge",
  "luxury-villa",
  "office-spaces",
  "privacy",
  "properties",
  "property",
  "register",
  "rent",
  "residential-homes",
  "sale",
  "short-term-rent",
  "terms",
]);

/** Static children of `[country]/[city]` — pages of their own, not listings. */
export const NON_LISTING_THIRD_SEGMENTS: ReadonlySet<string> = new Set(["info", "districts"]);

/**
 * Parameters that say where a visit came from and change nothing on the page.
 * A URL carrying only these is served the cached page (its canonical already
 * points at the bare path); rendering per request for every ad click would
 * spend the CPU the cache exists to save.
 */
const TRACKING_PARAM = /^(utm_[a-z_]+|gclid|gbraid|wbraid|gad_source|gad_campaignid|fbclid|msclkid|yclid|ysclid|srsltid|_gl|mc_cid|mc_eid)$/i;

export function isTrackingQueryParam(name: string): boolean {
  return TRACKING_PARAM.test(name);
}

function segmentsOf(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/** True for `/{locale}/{country}/{city}/…` — the geo listing route and nothing else. */
export function isGeoListingPathname(pathname: string, locales: readonly string[]): boolean {
  const parts = segmentsOf(pathname);
  if (parts.length < 3) return false;
  if (!locales.includes(parts[0])) return false;
  if (NON_LISTING_FIRST_SEGMENTS.has(parts[1].toLowerCase())) return false;
  if (parts[3] && NON_LISTING_THIRD_SEGMENTS.has(parts[3].toLowerCase())) return false;
  return true;
}

/** True when the query holds anything the page has to read. */
export function hasListingQuery(searchParams: URLSearchParams): boolean {
  for (const [name, value] of searchParams) {
    if (isTrackingQueryParam(name)) continue;
    if (value.trim() !== "") return true;
  }
  return false;
}

/**
 * The internal pathname a listing request with a query is rewritten to, or
 * `null` when the request should go where it was going.
 */
export function listingQueryRewritePathname(
  pathname: string,
  searchParams: URLSearchParams,
  locales: readonly string[],
): string | null {
  if (!isGeoListingPathname(pathname, locales)) return null;
  if (!hasListingQuery(searchParams)) return null;
  const [locale, ...rest] = segmentsOf(pathname);
  return `/${locale}/${LISTING_QUERY_SEGMENT}/${rest.join("/")}`;
}

/**
 * The public pathname for a request that names the internal route directly
 * (`/{locale}/listing-query/…`), or `null`. The internal path would otherwise
 * be a second address for every listing.
 */
export function listingQueryPublicPathname(pathname: string, locales: readonly string[]): string | null {
  const parts = segmentsOf(pathname);
  if (parts.length < 2 || !locales.includes(parts[0])) return null;
  if (parts[1].toLowerCase() !== LISTING_QUERY_SEGMENT) return null;
  const rest = parts.slice(2);
  return `/${parts[0]}${rest.length ? `/${rest.join("/")}` : ""}`;
}
