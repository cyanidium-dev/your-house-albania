import { resolveLocalizedString } from './localized';

export type LocalizedField =
  | { en?: string; uk?: string; ru?: string; sq?: string; it?: string }
  | null
  | undefined;

export const SOCIAL_METADATA_TEMPLATE_TITLE = 'Your House Albania';
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
