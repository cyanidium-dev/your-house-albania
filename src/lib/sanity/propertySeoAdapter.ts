import type { Metadata } from 'next';
import { resolveLocalizedString } from './localized';

type LocalizedField = { en?: string; uk?: string; ru?: string; sq?: string; it?: string } | null | undefined;

type PropertySeo = {
  metaTitle?: LocalizedField;
  metaDescription?: LocalizedField;
  ogTitle?: LocalizedField;
  ogDescription?: LocalizedField;
  ogImage?: { asset?: { url?: string } };
  noIndex?: boolean;
} | null | undefined;

type SiteDefaultSeo = {
  metaTitle?: LocalizedField;
  metaDescription?: LocalizedField;
} | null | undefined;

type PropertyMetadataOptions = {
  fallbackTitle: string;
  fallbackDescription: string;
  coverImageUrl?: string;
};

/**
 * Builds Next Metadata from property SEO (localized).
 * Uses property SEO first, then site default, then fallbacks.
 */
export function buildPropertyMetadata(
  propertySeo: PropertySeo,
  siteDefaultSeo: SiteDefaultSeo,
  locale: string,
  options: PropertyMetadataOptions
): Metadata {
  const { fallbackTitle, fallbackDescription, coverImageUrl } = options;

  const propertyMetaTitle = resolveLocalizedString(propertySeo?.metaTitle as never, locale);
  const siteTitle = resolveLocalizedString(siteDefaultSeo?.metaTitle as never, locale);

  const title =
    propertyMetaTitle ||
    (siteTitle ? `${fallbackTitle} | ${siteTitle}` : fallbackTitle);

  const description =
    resolveLocalizedString(propertySeo?.metaDescription as never, locale) ||
    resolveLocalizedString(siteDefaultSeo?.metaDescription as never, locale) ||
    fallbackDescription;

  const ogTitle =
    resolveLocalizedString(propertySeo?.ogTitle as never, locale) ||
    title;

  const ogDescription =
    resolveLocalizedString(propertySeo?.ogDescription as never, locale) ||
    description;

  const seoOgImageUrl = (propertySeo?.ogImage as { asset?: { url?: string } })?.asset?.url;
  const ogImageAbsolute =
    (seoOgImageUrl && seoOgImageUrl.startsWith('http') ? seoOgImageUrl : undefined) ||
    (coverImageUrl && coverImageUrl.startsWith('http') ? coverImageUrl : undefined);

  const noIndex = propertySeo?.noIndex ?? false;

  return {
    title,
    description: description || undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(ogImageAbsolute && {
        images: [{ url: ogImageAbsolute, width: 1200, height: 630, alt: ogTitle }],
      }),
    },
    twitter: {
      card: ogImageAbsolute ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
    },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}
