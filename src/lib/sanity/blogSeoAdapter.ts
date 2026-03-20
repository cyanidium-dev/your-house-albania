import type { Metadata } from 'next';
import { resolveLocalizedString } from './localized';

type LocalizedField = { en?: string; uk?: string; ru?: string; sq?: string; it?: string } | null | undefined;

type BlogSeo = {
  metaTitle?: LocalizedField;
  metaDescription?: LocalizedField;
  ogTitle?: LocalizedField;
  ogDescription?: LocalizedField;
  ogImage?: { asset?: { url?: string } };
  noIndex?: boolean;
  noFollow?: boolean;
} | null;

type SiteDefaultSeo = {
  metaTitle?: LocalizedField;
  metaDescription?: LocalizedField;
} | null;

/** Builds Next Metadata from blog post SEO or blog settings SEO. */
export function buildBlogMetadata(
  blogSeo: BlogSeo | undefined,
  siteDefaultSeo: SiteDefaultSeo | undefined,
  locale: string,
  fallbackTitle?: string,
  fallbackDescription?: string
): Metadata {
  const title =
    resolveLocalizedString(blogSeo?.metaTitle as never, locale) ||
    resolveLocalizedString(siteDefaultSeo?.metaTitle as never, locale) ||
    fallbackTitle ||
    'Blog';

  const description =
    resolveLocalizedString(blogSeo?.metaDescription as never, locale) ||
    resolveLocalizedString(siteDefaultSeo?.metaDescription as never, locale) ||
    fallbackDescription ||
    '';

  const ogTitle = resolveLocalizedString(blogSeo?.ogTitle as never, locale) || title;
  const ogDescription = resolveLocalizedString(blogSeo?.ogDescription as never, locale) || description;

  const ogImageUrl = (blogSeo?.ogImage as { asset?: { url?: string } })?.asset?.url;
  const ogImageAbsolute = ogImageUrl && ogImageUrl.startsWith('http') ? ogImageUrl : undefined;

  const noIndex = blogSeo?.noIndex ?? false;
  const noFollow = blogSeo?.noFollow ?? false;

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
    robots: noIndex || noFollow ? { index: !noIndex, follow: !noFollow } : undefined,
  };
}
