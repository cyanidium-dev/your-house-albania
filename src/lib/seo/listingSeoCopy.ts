/**
 * Keyword-driven titles and descriptions for the geo catalog pages.
 *
 * These are the fallback used whenever a page has no CMS `catalogSeoPage`
 * entry — which, before this helper, meant every such page inherited
 * `Listing.properties.title`, a marketing line ("Discover inspiring designed
 * homes.") carrying no target keyword. It reached production titles verbatim,
 * next to a raw lowercase slug: "Discover inspiring designed homes. — shengjin".
 *
 * Wording per locale follows seo-ahrefs-research.md, so each market gets the
 * phrase it actually searches for rather than a translation of the English one.
 */

import { getTranslations } from "next-intl/server";
import { fetchCityNameForms } from "@/lib/sanity/queries/district";

export type ListingSeoCopy = { title: string; description: string };

/** Slug fallback when the CMS has no city document: "shengjin" → "Shengjin". */
function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * City name in the form the templates expect. Albanian templates end in "në",
 * which governs the locative ("në Tiranë", not "në Tirana"), so prefer that
 * form when an editor has supplied it.
 *
 * The other declining languages — ru, uk, pl — get no case form here, because
 * the CMS stores none for them. Their templates are written to lead with the
 * bare city name instead of following a preposition, so the nominative is
 * always correct: "Saranda: nieruchomości…", never "w Sarande" for
 * "w Sarandzie".
 */
export async function resolveCityDisplayName(citySlug: string, locale: string): Promise<string> {
  const slug = typeof citySlug === "string" ? citySlug.trim().toLowerCase() : "";
  if (!slug) return "";
  const forms = await fetchCityNameForms(slug, locale);
  const preferred = locale === "sq" ? forms.locative || forms.base : forms.base;
  const name = (preferred || "").trim();
  // fetchCityNameForms falls back to the slug itself, which would otherwise
  // reach the title lowercased.
  return !name || name === slug ? titleCaseSlug(slug) : name;
}

/** Title and description for a city catalog page. */
export async function buildCityListingSeo(
  citySlug: string,
  locale: string
): Promise<ListingSeoCopy | null> {
  const city = await resolveCityDisplayName(citySlug, locale);
  if (!city) return null;
  const t = await getTranslations("Seo.listing");
  return {
    title: t("cityTitle", { city }),
    description: t("cityDescription", { city }),
  };
}

/**
 * Property-type slugs that carry their own SEO copy, matching the `propertyType`
 * documents in the CMS. Anything outside this set returns null so the caller
 * keeps the untyped city/country copy rather than printing a raw slug.
 *
 * The plural, search-shaped nouns live in `Seo.listing.types` rather than in the
 * CMS `propertyType.title`, which is singular and — for pl and it — untranslated.
 */
const TYPE_SLUGS = new Set([
  "apartment",
  "house",
  "villa",
  "studio",
  "penthouse",
  "land",
  "office",
  "commercial-space",
  "short-term-rent",
]);

async function resolveTypeLabel(typeSlug: string, locale: string): Promise<string | null> {
  const slug = typeof typeSlug === "string" ? typeSlug.trim().toLowerCase() : "";
  if (!slug || !TYPE_SLUGS.has(slug)) return null;
  const t = await getTranslations({ locale, namespace: "Seo.listing.types" });
  const label = t(slug).trim();
  // A missing message makes next-intl echo the key path back. Printing
  // "Seo.listing.types.villa for Sale in Albania" is worse than dropping the
  // type and keeping the untyped copy, so treat that shape as absent.
  if (!label || label.endsWith(`.${slug}`)) return null;
  return label;
}

/**
 * Title and description for a national type listing (`/{locale}/sale/{type}`).
 *
 * Returns null for unknown types so the caller falls back to the untyped copy.
 */
export async function buildTypeListingSeo(
  typeSlug: string,
  locale: string
): Promise<ListingSeoCopy | null> {
  const type = await resolveTypeLabel(typeSlug, locale);
  if (!type) return null;
  const t = await getTranslations({ locale, namespace: "Seo.listing" });
  return {
    title: t("typeTitle", { type }),
    description: t("typeDescription", { type }),
  };
}

/**
 * Title and description for a city + type listing
 * (`/{locale}/{country}/{city}/{deal}/{type}`).
 */
export async function buildCityTypeListingSeo(
  citySlug: string,
  typeSlug: string,
  locale: string
): Promise<ListingSeoCopy | null> {
  const [city, type] = await Promise.all([
    resolveCityDisplayName(citySlug, locale),
    resolveTypeLabel(typeSlug, locale),
  ]);
  if (!city || !type) return null;
  const t = await getTranslations({ locale, namespace: "Seo.listing" });
  return {
    title: t("cityTypeTitle", { type, city }),
    description: t("cityTypeDescription", { type, city }),
  };
}

/** Title and description for the country-level listing. */
export async function buildCountryListingSeo(): Promise<ListingSeoCopy> {
  const t = await getTranslations("Seo.listing");
  return { title: t("countryTitle"), description: t("countryDescription") };
}

/** Title and description for the root catalogue. */
export async function buildCatalogListingSeo(): Promise<ListingSeoCopy> {
  const t = await getTranslations("Seo.listing");
  return { title: t("catalogTitle"), description: t("catalogDescription") };
}
