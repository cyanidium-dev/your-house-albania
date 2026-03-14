import type { PropertyHomes } from '@/types/properyHomes';
import type { CatalogProperty } from './client';
import { resolveLocalizedString } from './localized';

/** Fields for property details page top section (title, location, specs, price, description). */
export type PropertyDetailsFields = {
  title: string;
  location: string;
  rate: string;
  beds: number;
  baths: number;
  area: number;
  description: string;
  dealTypeLabel: string;
};

type SanityPropertyForDetails = {
  title?: unknown;
  price?: number;
  currency?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: { title?: unknown };
  district?: { title?: unknown };
  description?: unknown;
  status?: string;
};

type SanityGalleryItem = { asset?: { url?: string }; alt?: string };

/** Extracts gallery images from Sanity property. Returns empty array if none. */
export function mapSanityPropertyGallery(
  p: { gallery?: SanityGalleryItem[] } | null | undefined
): { url: string; alt?: string }[] {
  const items = Array.isArray(p?.gallery) ? p.gallery : [];
  return items
    .filter((g) => g?.asset?.url)
    .map((g) => ({ url: (g as { asset: { url: string } }).asset.url, alt: (g as { alt?: string }).alt }));
}

/** Maps Sanity status to deal type label. Fallback: "Price". */
export function mapStatusToDealTypeLabel(status: string | null | undefined): string {
  if (!status || typeof status !== 'string') return 'Price';
  const s = status.toLowerCase();
  if (s === 'sale') return 'Sale';
  if (s === 'rent') return 'Rent';
  if (s === 'short-term' || s === 'shortterm') return 'Short-term rent';
  if (s === 'long-term' || s === 'longterm') return 'Long-term rent';
  return status; // fallback: show raw value
}

/** Maps Sanity property to fields for property details page. Uses empty strings/0 for missing. */
export function mapSanityPropertyToDetailsFields(
  p: SanityPropertyForDetails | null | undefined,
  locale: string
): PropertyDetailsFields {
  if (!p) {
    return { title: '', location: '', rate: '', beds: 0, baths: 0, area: 0, description: '', dealTypeLabel: 'Price' };
  }
  const cityTitle = resolveLocalizedString(p.city?.title as never, locale);
  const districtTitle = resolveLocalizedString(p.district?.title as never, locale);
  const location = [districtTitle, cityTitle].filter(Boolean).join(', ') || '';
  const desc = resolveLocalizedString(p.description as never, locale);
  const price = p.price ?? 0;
  const currency = p.currency ?? 'EUR';
  const rate = price > 0 ? `${price.toLocaleString()} ${currency}` : '';
  return {
    title: resolveLocalizedString(p.title as never, locale) || '',
    location,
    rate,
    beds: p.bedrooms ?? 0,
    baths: p.bathrooms ?? 0,
    area: p.area ?? 0,
    description: desc || '',
    dealTypeLabel: mapStatusToDealTypeLabel(p.status),
  };
}

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

/** Maps catalog query result item to PropertyHomes for listing/card UI. */
export function mapCatalogPropertyToCard(
  p: CatalogProperty,
  locale: string
): PropertyHomes {
  const base: SanityProperty = {
    _id: p._id,
    title: p.title,
    slug: p.slug,
    price: p.price,
    currency: p.currency,
    area: p.area,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    city: p.city as { title?: unknown },
    district: p.district as { title?: unknown },
    mainImageUrl: p.mainImageUrl,
  };

  return mapSanityPropertyToCard(base, locale);
}
