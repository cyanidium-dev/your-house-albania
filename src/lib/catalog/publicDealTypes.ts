import { dealRouteSegmentToQueryValue } from '@/lib/routes/catalogPathPrimitives'

/** Catalog `deal` query values (same union as `DEAL_TYPE_VALUES` / `PropertiesDealParam`). */
export type DealType = 'sale' | 'rent' | 'short-term'

/**
 * Deal types exposed in the public UI: navigation, footer, hero search tabs,
 * catalog filter options and sitemaps/indexing.
 *
 * Domlivo sells only. A deal type left out of this array is gone from the
 * site, not just hidden: its routes (`/rent`, `/short-term-rent`,
 * `/investment/rent`, `/<country>/<city>/rent`) return 404, its properties are
 * not public anywhere (their own pages included) and the catalog ignores it as
 * a filter. The rental listings were archived in the CMS on 2026-09-15.
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

/**
 * True when `deal` is the only public deal type. Unfiltered catalog views are
 * already limited to the public deals, so a listing filtered by the sole one
 * shows exactly what the unfiltered listing shows: `/albania/durres/sale` and
 * `/albania/durres` were two indexable URLs with one list, one title and one
 * H1. Goes false by itself the day a second deal type is made public.
 */
export function isSolePublicDealQuery(deal?: string | null): boolean {
  return PUBLIC_DEAL_TYPES.length === 1 && isPublicDealQuery(deal)
}

/** {@link isSolePublicDealQuery} for a deal ROUTE segment. */
export function isSolePublicDealRouteSegment(segment?: string | null): boolean {
  return isSolePublicDealQuery(dealRouteSegmentToQueryValue(segment ?? undefined))
}
