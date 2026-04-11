/**
 * Maps Sanity `landingPage` documents to public app paths (segments after `/{locale}/`).
 * Only routes that exist in the App Router are returned — unknown slugs are omitted until
 * a matching page + CMS convention is added here.
 */

import {
  LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG,
  normalizeCatalogCountrySlug,
} from "@/lib/routes/catalog";

export type LandingPageSitemapRow = {
  _id: string;
  slug: string;
  pageType?: string;
  _updatedAt?: string;
  seo?: { noIndex?: boolean };
  linkedCitySlug?: string | null;
  linkedCityCountrySlug?: string | null;
};

/**
 * Resolves a single landing document to a path under `[locale]`, or `null` if it should
 * not appear in the sitemap (non-routable, noindex, or represented elsewhere e.g. home).
 */
export function resolveLandingPathForSitemap(doc: LandingPageSitemapRow): string | null {
  if (doc.seo?.noIndex === true) return null;
  const slug = typeof doc.slug === "string" ? doc.slug.trim() : "";
  if (!slug) return null;

  // Home is covered by `/${locale}`; do not emit a second URL for the home landing doc.
  if (doc._id === "landing-home" || slug === "landing-home" || slug === "home") {
    return null;
  }

  if (doc._id === "landing-cities" || doc.pageType === "cityIndex") {
    return "cities";
  }

  if (doc.pageType === "city" && doc.linkedCitySlug && typeof doc.linkedCitySlug === "string") {
    const city = doc.linkedCitySlug.trim();
    if (!city) return null;
    const country = normalizeCatalogCountrySlug(
      typeof doc.linkedCityCountrySlug === "string" ? doc.linkedCityCountrySlug : LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG
    );
    return `${country}/${city}/info`;
  }

  // Deal landings: CMS slug → editorial investment path.
  if (slug === "sale") return "investment/sale";
  if (slug === "long-term-rent") return "investment/rent";
  if (slug === "short-term-rent") return "investment/short-term-rent";

  // Slug matches a dedicated route that loads this document via `fetchLandingPageBySlug`.
  if (slug === "for-realtors") return "for-realtors";

  return null;
}
