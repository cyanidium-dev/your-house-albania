import { resolveLocalizedString } from './localized';

export type PropertyTypeCard = {
  _id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  imageUrl: string;
  imageAlt: string;
  active?: boolean;
  order?: number;
};

type SanityPropertyType = {
  _id?: string;
  title?: unknown;
  slug?: string | { current?: string };
  shortDescription?: unknown;
  imageUrl?: string;
  imageAlt?: string;
  image?: { asset?: { url?: string }; alt?: string };
  active?: boolean;
  order?: number;
};

export function mapSanityPropertyTypeToCard(
  p: SanityPropertyType,
  locale: string
): PropertyTypeCard {
  const slug =
    typeof p.slug === 'string' ? p.slug : (p.slug as { current?: string })?.current ?? '';
  const imageUrl =
    p.imageUrl ??
    (p.image as { asset?: { url?: string } } | undefined)?.asset?.url ??
    '';
  const imageAlt =
    p.imageAlt ??
    (p.image as { alt?: string } | undefined)?.alt ??
    resolveLocalizedString(p.title as never, locale);
  return {
    _id: p._id,
    title: resolveLocalizedString(p.title as never, locale) || '—',
    slug,
    shortDescription: resolveLocalizedString(p.shortDescription as never, locale) || '',
    imageUrl,
    imageAlt: imageAlt || '—',
    active: p.active,
    order: p.order,
  };
}
