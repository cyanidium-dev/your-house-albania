import { nonGeoDealListingPath } from "@/lib/routes/catalog";

/**
 * Placeholder locale only — we take the suffix after `/${locale}` so nav configs stay locale-agnostic.
 * Paths match `nonGeoDealListingPath(locale, segment)` for top-level non-geo deal category routes.
 */
const PLACEHOLDER_LOCALE = "z";

function dealNavHrefSuffix(dealRouteSegment: string): `/${string}` {
  const full = nonGeoDealListingPath(PLACEHOLDER_LOCALE, dealRouteSegment);
  return full.slice(`/${PLACEHOLDER_LOCALE}`.length) as `/${string}`;
}

/**
 * Hrefs for stable nav (`resolvedHref` prepends `/${locale}`).
 * `buy` uses the **`sale`** route segment — `/{locale}/sale/[[...filters]]` is the catalog listing;
 * there is no separate `/buy` page in the app tree.
 */
export const NON_GEO_DEAL_NAV_HREF = {
  buy: dealNavHrefSuffix("sale"),
  rent: dealNavHrefSuffix("rent"),
  shortTermRent: dealNavHrefSuffix("short-term-rent"),
} as const;
