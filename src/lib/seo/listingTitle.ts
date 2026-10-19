import type { Metadata } from "next";
import { buildOgImageArray } from "@/lib/sanity/socialMetadataResolution";
import { ogLocale } from "@/lib/seo/ogLocale";
import { MAX_LISTING_TITLE_LENGTH, fitListingTitle, withBrand } from "@/lib/seo/brandTitle";

/**
 * "Page 2" in each site locale, for the title of a later catalogue page
 * (`?page=N`, self-canonical since audit M-2). Without it pages 2–31 of
 * `/sale` shipped the same <title> as page one. Composed here, like the photo
 * alt text in `propertyImageAlt`, because metadata is built outside any
 * component and the word order is the same in every locale.
 */
const PAGE_LABEL: Record<string, (page: number) => string> = {
  en: (n) => `Page ${n}`,
  de: (n) => `Seite ${n}`,
  it: (n) => `Pagina ${n}`,
  pl: (n) => `Strona ${n}`,
  ru: (n) => `Страница ${n}`,
  uk: (n) => `Сторінка ${n}`,
  sq: (n) => `Faqja ${n}`,
};

export type ListingTitlePage = { page: number | null | undefined; locale: string };

function pageSuffix(page?: ListingTitlePage): string {
  if (!page?.page || page.page < 2) return "";
  const label = PAGE_LABEL[page.locale] ?? PAGE_LABEL.en;
  return ` — ${label(page.page)}`;
}

/** The listing title with " — Page N" on a later page; unchanged on page one. */
export function listingPageTitle(title: string, page?: ListingTitlePage): string {
  return `${title}${pageSuffix(page)}`;
}

/**
 * Root layout applies a `%s — Domlivo` title template. A resolved listing
 * title may already contain the brand (a CMS catalog-SEO metaTitle like
 * "Pasuri në Shqipëri | Domlivo"), and a long one has no room for it: both
 * are decided in one place, `withBrand`, and the result is absolute.
 */
export function listingTitleField(title: string, page?: ListingTitlePage): Metadata["title"] {
  // Absolute, so the root layout's `%s — Domlivo` template stays out of it:
  // `withBrand` decides whether the brand fits (lib/seo/brandTitle).
  const suffix = pageSuffix(page);
  if (!suffix) return { absolute: withBrand(fitListingTitle(title)) };
  // A later page keeps its page number: the place title gives up its trailing
  // segments to make room, never the suffix.
  return { absolute: withBrand(`${fitListingTitle(title, MAX_LISTING_TITLE_LENGTH - suffix.length)}${suffix}`) };
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
