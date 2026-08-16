import type { Metadata } from 'next';
import { resolveLocalizedString } from './localized';

export type LocalizedField =
  | { en?: string; uk?: string; ru?: string; sq?: string; it?: string }
  | null
  | undefined;

export const SOCIAL_METADATA_TEMPLATE_TITLE = 'Domlivo';
export const SOCIAL_METADATA_TEMPLATE_DESCRIPTION =
  'Real estate in Albania. Buy, rent, and invest in properties across Albania.';

function trimNonEmpty(s: string | undefined | null): string | undefined {
  const t = typeof s === 'string' ? s.trim() : '';
  return t ? t : undefined;
}

/**
 * Social / document title fallback chain (localized where applicable):
 * 1. seo.ogTitle
 * 2. seo.metaTitle
 * 3. item main title (plain string, already localized by caller)
 * 4. site defaultSeo.metaTitle
 * 5. template
 */
export function resolveChainedTitle(
  locale: string,
  layers: {
    ogTitle?: unknown;
    metaTitle?: unknown;
    itemTitle?: string;
    siteMetaTitle?: unknown;
  }
): string {
  return (
    trimNonEmpty(resolveLocalizedString(layers.ogTitle as never, locale)) ||
    trimNonEmpty(resolveLocalizedString(layers.metaTitle as never, locale)) ||
    trimNonEmpty(layers.itemTitle) ||
    trimNonEmpty(resolveLocalizedString(layers.siteMetaTitle as never, locale)) ||
    SOCIAL_METADATA_TEMPLATE_TITLE
  );
}

/**
 * Social / document description fallback chain:
 * 1. seo.ogDescription
 * 2. seo.metaDescription
 * 3. item description / summary (plain string, already localized)
 * 4. site defaultSeo.metaDescription
 * 5. template
 */
export function resolveChainedDescription(
  locale: string,
  layers: {
    ogDescription?: unknown;
    metaDescription?: unknown;
    itemDescription?: string;
    siteMetaDescription?: unknown;
  }
): string {
  return (
    trimNonEmpty(resolveLocalizedString(layers.ogDescription as never, locale)) ||
    trimNonEmpty(resolveLocalizedString(layers.metaDescription as never, locale)) ||
    trimNonEmpty(layers.itemDescription) ||
    trimNonEmpty(resolveLocalizedString(layers.siteMetaDescription as never, locale)) ||
    SOCIAL_METADATA_TEMPLATE_DESCRIPTION
  );
}

/** First absolute http(s) URL among candidates. */
export function pickAbsoluteOgImageUrl(...candidates: (string | undefined | null)[]): string | undefined {
  for (const u of candidates) {
    if (typeof u === 'string' && u.trim().startsWith('http')) return u.trim();
  }
  return undefined;
}

/** Standard 1200×630 Open Graph image array, or undefined when no image. */
/** Social cards want 1200x630; our source photos are whatever shape they are. */
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Ask the Sanity CDN for a real 1200x630 crop. Without this the tags declared
 * 1200x630 while serving, say, a 1280x960 photo — scrapers that trust the
 * numbers letterbox or reject it, which is one reason link previews came out
 * as small square thumbnails.
 */
function toOgImageUrl(url: string): string {
  if (!url.includes('cdn.sanity.io')) return url;
  const [base, query = ''] = url.split('?');
  const params = new URLSearchParams(query);
  params.set('w', String(OG_WIDTH));
  params.set('h', String(OG_HEIGHT));
  params.set('fit', 'crop');
  params.set('auto', 'format');
  return `${base}?${params.toString()}`;
}

export function buildOgImageArray(
  url: string | undefined,
  alt: string
): NonNullable<Metadata['openGraph']>['images'] | undefined {
  return url ? [{ url: toOgImageUrl(url), width: OG_WIDTH, height: OG_HEIGHT, alt }] : undefined;
}

export type BuildMetadataInput = {
  /** Document title. Pass `{ absolute }` to bypass the root layout title template. */
  title: string | { absolute: string };
  description?: string;
  keywords?: string[];
  /** Open Graph / Twitter title (image alt also uses this). */
  ogTitle: string;
  ogDescription: string;
  ogImageUrl?: string;
  /** Absolute og:url; omit to leave it off (e.g. landing pages don't set it). */
  ogUrl?: string;
  /** Twitter card type; omit to drop the twitter block entirely. */
  twitterCard?: 'summary' | 'summary_large_image';
  /**
   * `article` for editorial pages, which is also what makes the
   * `article:modified_time` below mean anything. Defaults to `website`.
   */
  ogType?: 'website' | 'article';
  canonical?: string;
  hreflangLanguages?: NonNullable<Metadata['alternates']>['languages'];
  robots?: Metadata['robots'];
  /** Editorial freshness → `article:modified_time`; pair it with `ogType: 'article'`. */
  modifiedTimeIso?: string;
};

/**
 * Assembles the shared Next.js Metadata shape (openGraph/twitter/alternates) from
 * already-resolved fields. Each *SeoAdapter maps its document to this input and
 * keeps its own title/description/robots resolution.
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const images = buildOgImageArray(input.ogImageUrl, input.ogTitle);

  const openGraph: Metadata['openGraph'] = {
    type: input.ogType ?? 'website',
    title: input.ogTitle,
    description: input.ogDescription,
    ...(images ? { images } : {}),
    ...(input.ogUrl ? { url: input.ogUrl } : {}),
  };

  const alternates =
    input.canonical || input.hreflangLanguages
      ? {
          ...(input.canonical ? { canonical: input.canonical } : {}),
          ...(input.hreflangLanguages ? { languages: input.hreflangLanguages } : {}),
        }
      : undefined;

  return {
    title: input.title,
    description: input.description || undefined,
    ...(input.keywords ? { keywords: input.keywords } : {}),
    ...(alternates ? { alternates } : {}),
    openGraph,
    ...(input.twitterCard
      ? {
          twitter: {
            card: input.twitterCard,
            title: input.ogTitle,
            description: input.ogDescription,
          },
        }
      : {}),
    ...(input.robots !== undefined ? { robots: input.robots } : {}),
    ...(input.modifiedTimeIso
      ? { other: { 'article:modified_time': input.modifiedTimeIso } }
      : {}),
  };
}
