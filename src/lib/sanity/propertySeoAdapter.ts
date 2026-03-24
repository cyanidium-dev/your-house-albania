import type { Metadata } from 'next';
import type { LocalizedField } from './socialMetadataResolution';
import {
  pickAbsoluteOgImageUrl,
  resolveChainedDescription,
  resolveChainedTitle,
} from './socialMetadataResolution';

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
  ogImage?: { asset?: { url?: string } };
} | null | undefined;

export type PropertyMetadataOptions = {
  /** Localized property title (maps to `title` field). */
  itemTitle: string;
  /** Localized property body description; omit if empty. */
  itemDescription?: string;
  coverImageUrl?: string;
};

/**
 * Builds Next Metadata from property SEO (localized) with social fallback chain:
 * title: ogTitle → metaTitle → itemTitle → site metaTitle → template
 * description: ogDescription → metaDescription → itemDescription → site metaDescription → template
 * Images: seo.ogImage → gallery first image → site defaultSeo.ogImage
 * Twitter: summary (compact card hint); Open Graph image tags unchanged when URL exists.
 */
export function buildPropertyMetadata(
  propertySeo: PropertySeo,
  siteDefaultSeo: SiteDefaultSeo,
  locale: string,
  options: PropertyMetadataOptions
): Metadata {
  const { itemTitle, itemDescription, coverImageUrl } = options;

  const title = resolveChainedTitle(locale, {
    ogTitle: propertySeo?.ogTitle,
    metaTitle: propertySeo?.metaTitle,
    itemTitle,
    siteMetaTitle: siteDefaultSeo?.metaTitle,
  });

  const description = resolveChainedDescription(locale, {
    ogDescription: propertySeo?.ogDescription,
    metaDescription: propertySeo?.metaDescription,
    itemDescription,
    siteMetaDescription: siteDefaultSeo?.metaDescription,
  });

  const ogImageAbsolute = pickAbsoluteOgImageUrl(
    propertySeo?.ogImage?.asset?.url,
    coverImageUrl,
    siteDefaultSeo?.ogImage?.asset?.url
  );

  const noIndex = propertySeo?.noIndex ?? false;

  return {
    title,
    description: description || undefined,
    openGraph: {
      title,
      description,
      ...(ogImageAbsolute && {
        images: [{ url: ogImageAbsolute, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}
