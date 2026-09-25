import type { Metadata } from "next";
import { buildOgImageArray } from "@/lib/sanity/socialMetadataResolution";
import { ogLocale } from "@/lib/seo/ogLocale";
import { withBrand } from "@/lib/seo/brandTitle";

/**
 * Root layout applies a `%s — Domlivo` title template. A resolved listing
 * title may already contain the brand (a CMS catalog-SEO metaTitle like
 * "Pasuri në Shqipëri | Domlivo"), and a long one has no room for it: both
 * are decided in one place, `withBrand`, and the result is absolute.
 */
export function listingTitleField(title: string): Metadata["title"] {
  // Absolute, so the root layout's `%s — Domlivo` template stays out of it:
  // `withBrand` decides whether the brand fits (lib/seo/brandTitle).
  return { absolute: withBrand(title) };
}

/**
 * Localized Open Graph for listing pages. The root layout's `openGraph` is an
 * English default; without this, non-en listing pages leak English og:title /
 * og:description (CQ-07). Mirrors the resolved page title/description.
 *
 * `imageUrl` is the card `/api/og` draws for the page (see lib/seo/ogImageUrl);
 * without it a listing page shared on Telegram or WhatsApp had no picture at all.
 */
export function listingOpenGraph(
  title: string,
  description: string,
  imageUrl?: string,
  canonicalUrl?: string,
  locale?: string,
): Metadata["openGraph"] {
  const images = buildOgImageArray(imageUrl, title);
  const og = ogLocale(locale);
  return {
    ...(og ? { locale: og } : {}),
    // Setting `openGraph` on a page replaces the root layout's object rather
    // than merging into it, so `type` has to be restated here — without it 114
    // listing pages shipped a card with no og:type at all. `url` is the fourth
    // property Open Graph requires and was missing everywhere.
    type: "website",
    title,
    description,
    ...(images ? { images } : {}),
    ...(canonicalUrl ? { url: canonicalUrl } : {}),
  };
}
