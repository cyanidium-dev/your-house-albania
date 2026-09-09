import type { Metadata } from "next";
import { buildOgImageArray } from "@/lib/sanity/socialMetadataResolution";

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
 *
 * `imageUrl` is the card `/api/og` draws for the page (see lib/seo/ogImageUrl);
 * without it a listing page shared on Telegram or WhatsApp had no picture at all.
 */
export function listingOpenGraph(
  title: string,
  description: string,
  imageUrl?: string,
  canonicalUrl?: string,
): Metadata["openGraph"] {
  const images = buildOgImageArray(imageUrl, title);
  return {
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
