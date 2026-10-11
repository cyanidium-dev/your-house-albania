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
  _createdAt?: string;
  /** Editorial freshness date (YYYY-MM-DD), when the editor set one. */
  contentUpdatedAt?: string;
  seo?: { noIndex?: boolean };
  linkedCitySlug?: string | null;
  linkedCityCountrySlug?: string | null;
  /** `landingPage.locales` — the page exists only in these locales (empty/absent = all). */
  locales?: string[] | null;
};

/** A landing's locale scope, normalised: lower-case, unique, empty = every locale. */
export function landingRowLocales(row: Pick<LandingPageSitemapRow, "locales">): string[] {
  const raw = Array.isArray(row.locales) ? row.locales : [];
  const out: string[] = [];
  for (const l of raw) {
    const v = typeof l === "string" ? l.trim().toLowerCase() : "";
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

/**
 * Two documents resolving to one path (a city landing and a stray duplicate)
 * share the entry: the union of their scopes, and an unscoped one opens it to
 * every locale. `[]` means every locale.
 */
export function mergeLandingLocaleScopes(a: readonly string[], b: readonly string[]): string[] {
  if (a.length === 0 || b.length === 0) return [];
  return [...new Set([...a, ...b])];
}

/**
 * The locales a landing's URL is listed under: its scope, or all of them.
 * A Polish-only landing listed under /en, /de … would hand Google six 404s.
 */
export function landingSitemapLocales(scope: readonly string[], allLocales: readonly string[]): string[] {
  return scope.length ? allLocales.filter((l) => scope.includes(l)) : [...allLocales];
}

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
  // Legal pages live at the root, not under /guides — the footer and the
  // cookie banner have linked to these paths since before the pages existed.
  if (slug === "privacy") return "privacy";
  if (slug === "terms") return "terms";

  // Guides: universal /guides/<slug> route ("for-realtors" already returned
  // above as its static path; other reserved slugs can't exist per validation).
  if (doc.pageType === "custom") {
    return `guides/${slug}`;
  }

  // Unique landings: top-level /<slug> via the [country] single-segment resolver.
  if (doc.pageType === "unique") {
    return slug;
  }

  return null;
}
