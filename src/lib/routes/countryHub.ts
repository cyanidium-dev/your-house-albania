import { isSolePublicDealQuery } from "@/lib/catalog/publicDealTypes";
import { fetchCatalogCountryDocumentSlugs } from "@/lib/sanity/client";
import { nonGeoDealListingPath } from "@/lib/routes/catalogPathPrimitives";

/**
 * True while `/{country}` lists nothing `/sale` does not: the catalogue has one
 * country and one public deal. The `[country]` route redirects then, and every
 * crumb links `/sale` directly instead of going through the redirect.
 */
export async function isOnlyCatalogCountryHub(countrySlug: string): Promise<boolean> {
  if (!isSolePublicDealQuery("sale")) return false;
  const countries = await fetchCatalogCountryDocumentSlugs();
  return countries.length === 1 && countries[0] === countrySlug.trim().toLowerCase();
}

/** Where a country crumb should link: `/sale` when the hub redirects there, otherwise the hub. */
export async function countryHubHref(locale: string, countrySlug: string): Promise<string> {
  return (await isOnlyCatalogCountryHub(countrySlug))
    ? nonGeoDealListingPath(locale, "sale")
    : `/${locale}/${encodeURIComponent(countrySlug)}`;
}
