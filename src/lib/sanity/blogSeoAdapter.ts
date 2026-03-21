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

type ArticleMetadataOptions = {
  coverImageUrl?: string;
  baseUrl?: string;
  slug?: string;
};

/** Builds Next Metadata from blog post SEO or blog settings SEO. */
export function buildBlogMetadata(
  blogSeo: BlogSeo | undefined,
  siteDefaultSeo: SiteDefaultSeo | undefined,
  locale: string,
  fallbackTitle?: string,
  fallbackDescription?: string,
  categoryLabel?: string,
  articleOptions?: ArticleMetadataOptions
): Metadata {
  let title =
    resolveLocalizedString(blogSeo?.metaTitle as never, locale) ||
    resolveLocalizedString(siteDefaultSeo?.metaTitle as never, locale) ||
    fallbackTitle ||
    'Blog';

  let description =
    resolveLocalizedString(blogSeo?.metaDescription as never, locale) ||
    resolveLocalizedString(siteDefaultSeo?.metaDescription as never, locale) ||
    fallbackDescription ||
    '';

  if (categoryLabel && categoryLabel.trim()) {
    title = `${title} — ${categoryLabel.trim()}`;
    description = description
      ? `${description} ${categoryLabel.trim()}`
      : categoryLabel.trim();
  }

  const ogTitle =
    categoryLabel && categoryLabel.trim()
      ? title
      : resolveLocalizedString(blogSeo?.ogTitle as never, locale) || title;
  const ogDescription =
    categoryLabel && categoryLabel.trim()
      ? description
      : resolveLocalizedString(blogSeo?.ogDescription as never, locale) || description;

  const seoOgImageUrl = (blogSeo?.ogImage as { asset?: { url?: string } })?.asset?.url;
  const coverFallback = articleOptions?.coverImageUrl;
  const ogImageAbsolute =
    (seoOgImageUrl && seoOgImageUrl.startsWith('http') ? seoOgImageUrl : undefined) ||
    (coverFallback && coverFallback.startsWith('http') ? coverFallback : undefined);

  const base = articleOptions?.baseUrl?.replace(/\/$/, '');
  const canonicalUrl =
    base && articleOptions?.slug
      ? `${base}/${locale}/blog/${articleOptions.slug}`
      : undefined;

  const noIndex = blogSeo?.noIndex ?? false;
  const noFollow = blogSeo?.noFollow ?? false;

  return {
    title,
    description: description || undefined,
    ...(canonicalUrl && {
      alternates: { canonical: canonicalUrl },
    }),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(canonicalUrl && { url: canonicalUrl }),
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
