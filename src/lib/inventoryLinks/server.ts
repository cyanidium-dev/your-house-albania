import { fetchCityLandingByCitySlug } from "@/lib/sanity/client";
import { cityInfoPath } from "@/lib/routes/catalog";

/**
 * The city's price page (`/{locale}/{country}/{city}/info`) when it exists and
 * is indexable: the route 404s without an enabled city landing, and the
 * landing's `seo.noIndex` is the page's robots tag (the same in every locale).
 */
export async function cityInfoHrefIfIndexable(
  locale: string,
  citySlug: string,
  countrySlug: string,
): Promise<string | null> {
  const landing = await fetchCityLandingByCitySlug(citySlug);
  if (!landing) return null;
  if ((landing.seo as { noIndex?: boolean } | null | undefined)?.noIndex === true) return null;
  return cityInfoPath(locale, citySlug, countrySlug);
}
