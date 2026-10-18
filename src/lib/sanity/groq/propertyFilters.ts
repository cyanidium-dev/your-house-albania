/**
 * Single source of truth for "this property is publicly visible".
 *
 * Mirrors the Studio's listing contract (domlivo-admin/lib/sanity/queries.ts →
 * PROPERTIES_LIST_QUERY): a property is public when it is published and its
 * lifecycle is active. `lifecycleStatus` is treated as active when undefined
 * (schema initialValue is "active", so legacy/imported docs stay visible).
 * Its deal type must also be one the site offers (PUBLIC_DEAL_TYPES): a rental
 * is not public anywhere, its own page included.
 *
 * Used on every public property surface (catalog, detail, homepage, carousels,
 * banners, sitemap) so draft/sold/archived/reserved listings never leak out.
 */

/**
 * GROQ predicate string. Pass a `prefix` when the property is reached through a
 * reference and you are filtering before/after a dereference, e.g.
 * `publishedPropertyFilter("property->")` for a `property->` field.
 */
export function publishedPropertyFilter(prefix = ""): string {
  return `${prefix}isPublished == true && (${prefix}lifecycleStatus == "active" || !defined(${prefix}lifecycleStatus)) && ${publicDealStatusFilter(prefix)}`;
}

/** Convenience constant for the common top-level (unprefixed) case. */
export const PUBLISHED_PROPERTY_FILTER = publishedPropertyFilter();

/** Lifecycle states whose page stays up with a label instead of a 404. */
export const INACTIVE_LISTING_STATUSES = ["sold", "archived", "reserved", "rented"] as const;
export type InactiveListingStatus = (typeof INACTIVE_LISTING_STATUSES)[number];

/**
 * The listing's own page also answers for a sold, reserved, rented or
 * archived property: the address keeps working from old links, messengers,
 * search results and the language switcher, the page says what happened and
 * offers to find a similar one (2026-10-18). Partner imports archive listings
 * daily; until then the page in the visitor's language was still cached while
 * the other six languages were already 404s. Lists, carousels and sitemaps
 * keep using `publishedPropertyFilter`, so an inactive listing appears nowhere
 * else. Only `draft` stays private.
 */
export function publishedPropertyDetailFilter(prefix = ""): string {
  const states = ["active", ...INACTIVE_LISTING_STATUSES].map((s) => `"${s}"`).join(", ");
  return `${prefix}isPublished == true && (${prefix}lifecycleStatus in [${states}] || !defined(${prefix}lifecycleStatus)) && ${publicDealStatusFilter(prefix)}`;
}

export const PUBLISHED_PROPERTY_DETAIL_FILTER = publishedPropertyDetailFilter();

import { PUBLIC_DEAL_TYPES } from '@/lib/catalog/publicDealTypes';

/** GROQ predicate for "this property's deal type is one the site offers". */
export function publicDealStatusFilter(prefix = ''): string {
  const list = PUBLIC_DEAL_TYPES.map((d) => `"${d}"`).join(', ');
  return `${prefix}status in [${list}]`;
}

export const PUBLIC_DEAL_STATUS_FILTER = publicDealStatusFilter();
