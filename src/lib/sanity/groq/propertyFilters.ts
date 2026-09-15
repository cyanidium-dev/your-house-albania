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

import { PUBLIC_DEAL_TYPES } from '@/lib/catalog/publicDealTypes';

/** GROQ predicate for "this property's deal type is one the site offers". */
export function publicDealStatusFilter(prefix = ''): string {
  const list = PUBLIC_DEAL_TYPES.map((d) => `"${d}"`).join(', ');
  return `${prefix}status in [${list}]`;
}

export const PUBLIC_DEAL_STATUS_FILTER = publicDealStatusFilter();
