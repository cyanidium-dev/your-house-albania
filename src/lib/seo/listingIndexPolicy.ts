/**
 * Shared numeric policy for deal + property-type listing URLs (geo + non-geo).
 * Kept in a module with no Sanity imports so sitemap fetchers can share it safely.
 */

/** Noindex + omit from sitemap for deal/type when total count ≤ this; index when count is greater. */
export const LISTING_DEAL_TYPE_NOINDEX_THRESHOLD = 15;
