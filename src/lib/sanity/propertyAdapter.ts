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
  description?: unknown;
  price?: number;
  currency?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
  featured?: boolean;
  investment?: string | boolean;
  coordinatesLat?: number | null;
  coordinatesLng?: number | null;
  city?: {
    title?: unknown;
    slug?: string;
  };
  district?: {
    title?: unknown;
    slug?: string;
    citySlug?: string;
  };
  type?: {
    title?: unknown;
    slug?: string;
  };
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
  const rawDescription = p.description as
    | { en?: string; uk?: string; ru?: string; sq?: string; it?: string }
    | string
    | null
    | undefined;
  const localizedDescription = resolveLocalizedString(rawDescription as never, locale);
  const rate = String(p.price ?? 0);
  const lat =
    typeof p.coordinatesLat === 'number' && Number.isFinite(p.coordinatesLat) ? p.coordinatesLat : undefined
  const lng =
    typeof p.coordinatesLng === 'number' && Number.isFinite(p.coordinatesLng) ? p.coordinatesLng : undefined

  return {
    name: resolveLocalizedString(p.title as never, locale) || (p.title as string) || '—',
    slug: p.slug ?? '',
    location,
    rate,
    beds: p.bedrooms ?? 0,
    baths: p.bathrooms ?? 0,
    area: p.area ?? 0,
    images: imageUrl ? [{ src: imageUrl }] : [],

    // extended semantic fields
    price: p.price,
    currency: p.currency,
    status: p.status,
    featured: typeof p.featured === 'boolean' ? p.featured : undefined,
    investment: p.investment,
    propertyType: p.type?.title
      ? (resolveLocalizedString(p.type.title as never, locale) || String(p.type.title))
      : undefined,
    propertyTypeSlug: p.type?.slug,
    city: cityTitle || undefined,
    citySlug: p.city?.slug,
    district: districtTitle || undefined,
    districtSlug: p.district?.slug,
    teaser: localizedDescription || undefined,
    coordinates: lat !== undefined || lng !== undefined ? { lat, lng } : undefined,
  };
}

/** Build images array for PropertyHomes from catalog item (gallery or single main). */
function catalogImages(p: CatalogProperty): { src: string }[] {
  const urls = Array.isArray(p.galleryUrls) && p.galleryUrls.length > 0
    ? p.galleryUrls
    : (p.mainImageUrl ? [p.mainImageUrl] : []);
  return urls.filter((url): url is string => typeof url === 'string' && url.length > 0).map((src) => ({ src }));
}

/** Maps catalog query result item to PropertyHomes for listing/card UI. */
export function mapCatalogPropertyToCard(
  p: CatalogProperty,
  locale: string
): PropertyHomes {
  const base = mapSanityPropertyToCard(
    {
      _id: p._id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      coordinatesLat: p.coordinatesLat ?? null,
      coordinatesLng: p.coordinatesLng ?? null,
      price: p.price,
      currency: p.currency,
      area: p.area,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      status: p.status,
      featured: p.featured,
      investment: p.investment,
      city: p.city as { title?: unknown; slug?: string },
      district: p.district as { title?: unknown; slug?: string; citySlug?: string },
      type: p.type as { title?: unknown; slug?: string },
      mainImageUrl: p.mainImageUrl,
    },
    locale
  );
  base.images = catalogImages(p);
  return base;
}
