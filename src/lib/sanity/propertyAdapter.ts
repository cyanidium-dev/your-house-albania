import type { PropertyHomes } from '@/types/properyHomes';
import { resolveLocalizedString } from './localized';

type SanityProperty = {
  _id?: string;
  title?: unknown;
  slug?: string;
  price?: number;
  currency?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: { title?: unknown };
  district?: { title?: unknown };
  mainImageUrl?: string;
  mainImage?: { asset?: { url?: string } };
};

/** Maps Sanity property to PropertyHomes for PropertyCard. */
export function mapSanityPropertyToCard(
  p: SanityProperty,
  locale: string
): PropertyHomes {
  const cityTitle = resolveLocalizedString(p.city?.title as never, locale);
  const districtTitle = resolveLocalizedString(p.district?.title as never, locale);
  const location = [districtTitle, cityTitle].filter(Boolean).join(', ') || '—';
  const imageUrl = p.mainImageUrl ?? (p.mainImage as { asset?: { url?: string } })?.asset?.url ?? '';
  const rate = String(p.price ?? 0);
  return {
    name: resolveLocalizedString(p.title as never, locale) || (p.title as string) || '—',
    slug: p.slug ?? '',
    location,
    rate,
    beds: p.bedrooms ?? 0,
    baths: p.bathrooms ?? 0,
    area: p.area ?? 0,
    images: imageUrl ? [{ src: imageUrl }] : [],
  };
}
