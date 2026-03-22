import type { Metadata } from "next";
import { resolveLocalizedString } from "./localized";

type RawSeo = {
  metaTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
  ogTitle?: Record<string, string>;
  ogDescription?: Record<string, string>;
  ogImage?: { asset?: { url?: string } };
  noIndex?: boolean;
};

type RawDefaultSeo = {
  metaTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
  noIndex?: boolean;
};

const TEMPLATE_TITLE = "Your House Albania";
const TEMPLATE_DESCRIPTION = "Real estate in Albania. Buy, rent, and invest in properties across Albania.";

/** Builds Next.js Metadata from homePage.seo with fallbacks (siteSettings.defaultSeo → template). */
export function buildHomeMetadata(
  homeSeo: RawSeo | null | undefined,
  siteDefaultSeo: RawDefaultSeo | null | undefined,
  locale: string,
): Metadata {
  const title =
    resolveLocalizedString(homeSeo?.metaTitle as never, locale) ||
    resolveLocalizedString(siteDefaultSeo?.metaTitle as never, locale) ||
    TEMPLATE_TITLE;

  const description =
    resolveLocalizedString(homeSeo?.metaDescription as never, locale) ||
    resolveLocalizedString(siteDefaultSeo?.metaDescription as never, locale) ||
    TEMPLATE_DESCRIPTION;

  const ogTitle =
    resolveLocalizedString(homeSeo?.ogTitle as never, locale) || title;

  const ogDescription =
    resolveLocalizedString(homeSeo?.ogDescription as never, locale) ||
    description;

  const ogImageUrl = (homeSeo?.ogImage as { asset?: { url?: string } })?.asset
    ?.url;
  const ogImageAbsolute =
    ogImageUrl && ogImageUrl.startsWith("http") ? ogImageUrl : undefined;

  const noIndex = homeSeo?.noIndex ?? siteDefaultSeo?.noIndex ?? false;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(ogImageAbsolute && {
        images: [
          { url: ogImageAbsolute, width: 1200, height: 630, alt: ogTitle },
        ],
      }),
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
