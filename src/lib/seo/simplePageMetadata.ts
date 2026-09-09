import type { Metadata } from "next";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";
import { isIndexingEnabled, indexingDisabledRobots } from "@/lib/seo/envSeo";
import { landingOgImageUrl, type LandingOgPhoto } from "@/lib/seo/ogImageUrl";
import { getSiteBaseUrl } from "@/lib/siteUrl";

export type SimplePageMetadataInput = {
  locale: string;
  /** Page title, without the brand — the root template appends that. */
  title: string;
  description?: string;
  /** Path after the locale, no leading slash: `contacts`, `blog/author/x`. */
  pathAfterLocale: string;
  /** Photograph for the drawn card; falls back to the default coast image. */
  photo?: LandingOgPhoto;
  robots?: Metadata["robots"];
};

/**
 * Metadata for the pages that are just a page — the blog and guide indexes,
 * contacts, register, image credits, how-to-publish, agent profiles.
 *
 * They used to return `{ title, description }` and nothing else, so they
 * inherited `og:type` and `og:site_name` from the root layout and had neither
 * an `og:image` nor an `og:url`: 90 URLs shipping a link preview with no
 * picture, and the Ahrefs crawl of 2026-09-10 flagging every one of them as an
 * incomplete Open Graph card. Landings and listings already build all four
 * required properties through their own adapters; this is the same contract for
 * everything that has no adapter of its own.
 *
 * The card is drawn by `/api/og` from the resolved title and description, the
 * same route the landings use, so these pages need no artwork to have a
 * picture.
 */
export function buildSimplePageMetadata(input: SimplePageMetadataInput): Metadata {
  const { locale, title, description, pathAfterLocale, photo, robots } = input;
  const path = pathAfterLocale.replace(/^\/+/, "");
  const base = getSiteBaseUrl().replace(/\/$/, "");
  const canonical = `${base}/${locale}${path ? `/${path}` : ""}`;
  const ogImage = landingOgImageUrl({ locale, title, subtitle: description, photo });

  const openGraph: Metadata["openGraph"] = {
    type: "website",
    title,
    description,
    url: canonical,
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  };

  if (!isIndexingEnabled()) {
    return {
      title,
      ...(description ? { description } : {}),
      openGraph,
      twitter: { card: "summary_large_image", title, description },
      robots: indexingDisabledRobots,
    };
  }

  const hreflang = buildHreflangAlternates(path ? `/${path}` : "");

  return {
    title,
    ...(description ? { description } : {}),
    alternates: {
      canonical,
      ...(hreflang?.languages ? { languages: hreflang.languages } : {}),
    },
    openGraph,
    twitter: { card: "summary_large_image", title, description },
    ...(robots !== undefined ? { robots } : {}),
  };
}
