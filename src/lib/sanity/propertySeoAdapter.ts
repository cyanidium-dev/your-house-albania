import type { Metadata } from 'next';
import { buildHreflangAlternates } from '@/lib/seo/hreflang';
import { indexingDisabledRobots, isIndexingEnabled } from '@/lib/seo/envSeo';
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
  /**
   * When set, adds canonical (unless overridden later) and hreflang for `/property/[slug]`.
   */
  propertyPath?: { baseUrl: string; locale: string; slug: string };
};

/**
 * Builds Next Metadata from property SEO (localized) with social fallback chain:
 * title: ogTitle → metaTitle → itemTitle → site metaTitle → template
 * description: ogDescription → metaDescription → itemDescription → site metaDescription → template
 * Images: seo.ogImage → gallery first image → site defaultSeo.ogImage
 * Twitter: same resolved title/description as metadata / Open Graph (summary card).
 */
export function buildPropertyMetadata(
  propertySeo: PropertySeo,
  siteDefaultSeo: SiteDefaultSeo,
  locale: string,
  options: PropertyMetadataOptions
): Metadata {
  const { itemTitle, itemDescription, coverImageUrl, propertyPath } = options;

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

  const ogBase: Metadata['openGraph'] = {
    title,
    description,
    ...(ogImageAbsolute && {
      images: [{ url: ogImageAbsolute, width: 1200, height: 630, alt: title }],
    }),
  };

  if (!isIndexingEnabled()) {
    return {
      title,
      description: description || undefined,
      openGraph: ogBase,
      twitter: {
        card: 'summary',
        title,
        description,
      },
      robots: indexingDisabledRobots,
    };
  }

  const pathSeg =
    propertyPath != null ? `/property/${encodeURIComponent(propertyPath.slug)}` : undefined;
  const canonicalFallback =
    propertyPath != null
      ? `${propertyPath.baseUrl.replace(/\/$/, '')}/${propertyPath.locale}${pathSeg}`
      : undefined;
  const hreflang = pathSeg != null ? buildHreflangAlternates(pathSeg) : undefined;
  const alternates =
    canonicalFallback || hreflang?.languages
      ? {
          ...(canonicalFallback ? { canonical: canonicalFallback } : {}),
          ...(hreflang?.languages ? { languages: hreflang.languages } : {}),
        }
      : undefined;

  return {
    title,
    description: description || undefined,
    alternates,
    openGraph: {
      ...ogBase,
      ...(canonicalFallback ? { url: canonicalFallback } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}
