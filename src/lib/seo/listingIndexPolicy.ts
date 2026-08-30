/**
 * Shared numeric policy for listing URLs (geo + non-geo).
 * Kept in a module with no Sanity imports so sitemap fetchers can share it safely.
 */

/** Noindex + omit from sitemap for deal/type when total count ≤ this; index when count is greater. */
export const LISTING_DEAL_TYPE_NOINDEX_THRESHOLD = 15;

/** Same idea for a `?district=` filter on a city listing. */
export const LISTING_DISTRICT_NOINDEX_THRESHOLD = 20;

/**
 * A bare city listing is held to a far looser bar than the combination pages
 * above: only a genuinely empty one is dropped.
 *
 * The deal+type threshold is 15 because those URLs are one of many slices of
 * the same inventory, and a thin slice adds nothing. A city page is the
 * canonical answer to "property for sale in {city}" — with four or six
 * listings it answers the question modestly, and demoting it would have taken
 * four of the seven cities out of the index. Zero is the unambiguous case:
 * there is nothing to show.
 */
export const EMPTY_CITY_LISTING_NOINDEX_MAX = 0;

/**
 * Whether a bare city listing should be noindexed.
 *
 * A non-numeric count means the inventory query failed. Treating that as
 * "empty" is the safe reading: better to withhold a page for one render than
 * to advertise one that may have nothing on it.
 */
export function shouldNoindexEmptyCityListing(totalCount: number): boolean {
  if (!Number.isFinite(totalCount)) return true;
  return totalCount <= EMPTY_CITY_LISTING_NOINDEX_MAX;
}
