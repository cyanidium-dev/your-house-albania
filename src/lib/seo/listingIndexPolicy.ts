/**
 * Numeric policy for listing URLs outside the SEO page registry.
 *
 * Geo listings (city, district, city + type, facets) are decided by
 * `evaluateSeoPage()` in `src/lib/seo/pages`; do not add thresholds for them
 * here. What remains are the national `/sale/{type}` pages and the bare
 * empty-listing check used by editorial pages.
 *
 * Kept in a module with no Sanity imports so sitemap fetchers can share it safely.
 */
import { SEO_PAGE_POLICY } from "@/lib/seo/pages/policy";

/**
 * National deal/type listings: noindex + omit from sitemap when total count ≤ this.
 * Same bar as a city + type page in the registry.
 */
export const LISTING_DEAL_TYPE_NOINDEX_THRESHOLD = SEO_PAGE_POLICY.cityType.minInventory - 1;

/** A listing with nothing on it answers nothing. */
export const EMPTY_CITY_LISTING_NOINDEX_MAX = 0;

/**
 * Whether a listing whose only index rule is "not empty" should be noindexed.
 *
 * A non-numeric count means the inventory query failed. Treating that as
 * "empty" is the safe reading: better to withhold a page for one render than
 * to advertise one that may have nothing on it.
 */
export function shouldNoindexEmptyCityListing(totalCount: number): boolean {
  if (!Number.isFinite(totalCount)) return true;
  return totalCount <= EMPTY_CITY_LISTING_NOINDEX_MAX;
}
