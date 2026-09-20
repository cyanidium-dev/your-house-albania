import { NON_LISTING_FIRST_SEGMENTS } from "./listingQueryRewrite";

/** Anchor of the card grid's heading on a listing page. */
export const LISTINGS_ANCHOR_ID = "listings";

/**
 * The listing of the city the visitor is already in, for "View properties"
 * buttons that would otherwise send them from Durrës to the whole country.
 *
 * `/{locale}/{country}/{city}/…` — the listing itself, a district or facet of
 * it, the city's `/info` page, its districts — gives
 * `/{locale}/{country}/{city}#listings`. Anything else gives `null` and the
 * button keeps its generic target. `countrySlugs`, when known, must contain
 * the country segment; without them the first segment only has to be no
 * route of its own.
 */
export function currentCityListingHref(
  pathname: string | null | undefined,
  locales: readonly string[],
  countrySlugs: readonly string[] = [],
): string | null {
  const parts = (pathname ?? "").split("/").filter(Boolean);
  if (parts.length < 3) return null;
  const [locale, country, city] = parts.map((p) => p.toLowerCase());
  if (!locales.includes(locale)) return null;
  if (NON_LISTING_FIRST_SEGMENTS.has(country)) return null;
  if (countrySlugs.length > 0 && !countrySlugs.some((slug) => slug.toLowerCase() === country)) return null;
  return `/${locale}/${country}/${city}#${LISTINGS_ANCHOR_ID}`;
}
