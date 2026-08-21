import type { Metadata } from "next";

const SITE_BRAND = "Domlivo";

/**
 * Root layout applies a `%s — Domlivo` title template. When a resolved listing
 * title already contains the brand (e.g. a CMS catalog-SEO metaTitle like
 * "Pasuri në Shqipëri | Domlivo"), returning a plain string double-brands the
 * tab. This returns `{ absolute }` in that case to bypass the template, and a
 * plain string otherwise so short titles still get the brand suffix.
 */
export function listingTitleField(title: string): Metadata["title"] {
  return title.includes(SITE_BRAND) ? { absolute: title } : title;
}

/**
 * Localized Open Graph for listing pages. The root layout's `openGraph` is an
 * English default; without this, non-en listing pages leak English og:title /
 * og:description (CQ-07). Mirrors the resolved page title/description.
 */
export function listingOpenGraph(title: string, description: string): Metadata["openGraph"] {
  return {
    title,
    description,
  };
}
