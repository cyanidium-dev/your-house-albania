import { dealRouteSegmentToQueryValue } from '@/lib/routes/catalogPathPrimitives'

/** Catalog `deal` query values (same union as `DEAL_TYPE_VALUES` / `PropertiesDealParam`). */
export type DealType = 'sale' | 'rent' | 'short-term'

/**
 * Deal types exposed in the public UI: navigation, footer, hero search tabs,
 * catalog filter options and sitemaps/indexing.
 *
 * Product decision (2026-07): rentals are HIDDEN from the UI — sale is the only
 * focus. Nothing is deleted: routes (`/rent`, `/short-term-rent`), property
 * statuses, CMS data and translations stay intact and keep working via direct
 * URLs (with `noindex`). To bring rentals back, add `'rent'` and/or
 * `'short-term'` back to this array — every consumer reads it.
 */
export const PUBLIC_DEAL_TYPES: DealType[] = ['sale']

/** True when a catalog `deal` query value is publicly exposed. */
export function isPublicDealQuery(deal?: string | null): boolean {
  if (!deal) return false
  return (PUBLIC_DEAL_TYPES as string[]).includes(deal)
}

/** True when a deal ROUTE segment (`sale` | `rent` | `short-term-rent`) is publicly exposed. */
export function isPublicDealRouteSegment(segment?: string | null): boolean {
  const query = dealRouteSegmentToQueryValue(segment ?? undefined)
  return isPublicDealQuery(query)
}
