import type { PropertyHomes } from '@/types/propertyHomes';
import type { CatalogProperty } from './client';
import { resolveLocalizedString } from './localized';

/** Fallback Iconify ID when iconKey is unknown or unresolved. */
const FALLBACK_ICONIFY_ID = 'ph:info';

/**
 * Maps Sanity icon keys to Iconify IDs (Phosphor where available, MDI for ph gaps).
 * Must stay in sync with Sanity canonical PROPERTY_ICON_KEYS.
 * Sanity stores plain keys; @iconify/react requires prefix:icon-name format.
 * Note: ph:parking and ph:balcony do not exist; using mdi:parking, mdi:balcony.
 */
const SANITY_ICON_KEY_TO_ICONIFY: Record<string, string> = {
  elevator: 'ph:elevator',
  balcony: 'mdi:balcony',
  parking: 'mdi:parking',
  snowflake: 'ph:snowflake',
  car: 'ph:car',
  waves: 'ph:waves',
  'map-pin': 'ph:map-pin',
  key: 'ph:key',
  smartphone: 'ph:device-mobile',
  layout: 'ph:squares-four',
  sun: 'ph:sun',
  shield: 'ph:shield',
  wifi: 'ph:wifi-high',
  home: 'ph:house-simple',
  building: 'ph:buildings',
  tree: 'ph:tree-evergreen',
  sofa: 'ph:couch',
  cloud: 'ph:cloud',
  zap: 'ph:lightning',
};

/** Supported Sanity keys (must match canonical PROPERTY_ICON_KEYS): elevator, balcony, parking, snowflake, car, waves, map-pin, key, smartphone, layout, sun, shield, wifi, home, building, tree, sofa, cloud, zap */

/**
 * Resolves a Sanity icon key to an Iconify ID for property amenities/offers.
 * Returns fallback when key is unknown so no empty icon spans remain.
 */
export function resolvePropertyIconKey(sanityKey: string | null | undefined): string {
  if (!sanityKey || typeof sanityKey !== 'string') return FALLBACK_ICONIFY_ID;
  const normalized = sanityKey.trim().toLowerCase();
  if (!normalized) return FALLBACK_ICONIFY_ID;
  const resolved = SANITY_ICON_KEY_TO_ICONIFY[normalized];
  if (resolved) return resolved;
  const noHyphen = normalized.replace(/-/g, '');
  if (SANITY_ICON_KEY_TO_ICONIFY[noHyphen]) return SANITY_ICON_KEY_TO_ICONIFY[noHyphen];
  if (normalized.includes(':')) return normalized;
  return FALLBACK_ICONIFY_ID;
}

/** Normalized amenity item for Property details block (icon + title + optional description). */
export type PropertyAmenityItem = {
  key: string;
  title: string;
  description?: string;
  iconKey?: string;
  customIconUrl?: string;
  customIconAlt?: string;
};

/** Normalized offer item for What this property offers block (icon + title). */
export type PropertyOfferItem = {
  key: string;
  title: string;
  iconKey?: string;
  customIconUrl?: string;
  customIconAlt?: string;
};

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

type SanityGalleryItem = { asset?: { url?: string }; alt?: string; label?: string };

/** Extracts gallery images from Sanity property. Returns empty array if none. */
export function mapSanityPropertyGallery(
  p: { gallery?: SanityGalleryItem[] } | null | undefined
): { url: string; alt?: string; label?: string }[] {
  const items = Array.isArray(p?.gallery) ? p.gallery : [];
  return items
    .filter((g) => g?.asset?.url)
    .map((g) => ({
      url: (g as { asset: { url: string } }).asset.url,
      alt: (g as { alt?: string }).alt,
      label: (g as { label?: string }).label,
    }));
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
  /** @legacy Pre-formatted string fallback when UI lacks formatFromEur. Prefer price + useCurrency().formatFromEur. */
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

type SanityAmenityItem = {
  _id?: string;
  _key?: string;
  title?: unknown;
  description?: unknown;
  iconKey?: string;
  icon?: string | { asset?: { url?: string }; alt?: string };
  image?: { asset?: { url?: string }; alt?: string };
  customIconUrl?: string;
  customIconAlt?: string;
};

type SanityPropertyOfferItem = {
  _id?: string;
  _key?: string;
  title?: unknown;
  iconKey?: string;
  icon?: string | { asset?: { url?: string }; alt?: string };
  image?: { asset?: { url?: string }; alt?: string };
  customIconUrl?: string;
  customIconAlt?: string;
};

function pickIconKey(item: { iconKey?: string; icon?: unknown } | null | undefined): string | undefined {
  if (!item) return undefined;
  const key = typeof item.iconKey === 'string' && item.iconKey.trim() ? item.iconKey.trim() : undefined;
  if (key) return key;
  const icon = item.icon;
  return typeof icon === 'string' && icon.trim() ? icon.trim() : undefined;
}

function pickCustomIconUrl(item: {
  customIconUrl?: string;
  icon?: unknown;
  image?: { asset?: { url?: string }; alt?: string };
} | null | undefined): string | undefined {
  if (!item) return undefined;
  const url = typeof item.customIconUrl === 'string' && item.customIconUrl.trim() ? item.customIconUrl.trim() : undefined;
  if (url) return url;
  const iconObj = item?.icon;
  const iconUrl = typeof iconObj === 'object' && iconObj !== null && 'asset' in iconObj
    ? (iconObj as { asset?: { url?: string } }).asset?.url
    : undefined;
  if (typeof iconUrl === 'string' && iconUrl.trim()) return iconUrl.trim();
  const imageObj = item?.image;
  const imageUrl = typeof imageObj === 'object' && imageObj !== null && 'asset' in imageObj
    ? (imageObj as { asset?: { url?: string } }).asset?.url
    : undefined;
  return typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : undefined;
}

function pickCustomIconAlt(item: {
  customIconAlt?: string;
  icon?: unknown;
  image?: { alt?: string };
} | null | undefined): string | undefined {
  if (!item) return undefined;
  if (typeof item.customIconAlt === 'string') return item.customIconAlt;
  const iconObj = item?.icon;
  if (typeof iconObj === 'object' && iconObj !== null && 'alt' in iconObj && typeof (iconObj as { alt: string }).alt === 'string') return (iconObj as { alt: string }).alt;
  const imageObj = item?.image;
  if (typeof imageObj === 'object' && imageObj !== null && 'alt' in imageObj && typeof (imageObj as { alt: string }).alt === 'string') return (imageObj as { alt: string }).alt;
  return undefined;
}

/** Maps Sanity amenities to Property details block. Skips items with empty title after localization. */
export function mapSanityAmenities(
  p: { amenities?: SanityAmenityItem[] } | null | undefined,
  locale: string
): PropertyAmenityItem[] {
  const items = Array.isArray(p?.amenities) ? p.amenities : [];
  const result: PropertyAmenityItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = resolveLocalizedString(item?.title as never, locale)?.trim() ?? '';
    if (!title) continue;
    const key = (item as { _key?: string })._key ?? (item as { _id?: string })._id ?? `amenity-${i}`;
    const description = resolveLocalizedString(item?.description as never, locale)?.trim() || undefined;
    result.push({
      key: String(key),
      title,
      description: description || undefined,
      iconKey: pickIconKey(item),
      customIconUrl: pickCustomIconUrl(item),
      customIconAlt: pickCustomIconAlt(item),
    });
  }
  return result;
}

/** Maps Sanity propertyOffers to What this property offers block. Skips items with empty title after localization. */
export function mapSanityPropertyOffers(
  p: { propertyOffers?: SanityPropertyOfferItem[] } | null | undefined,
  locale: string
): PropertyOfferItem[] {
  const items = Array.isArray(p?.propertyOffers) ? p.propertyOffers : [];
  const result: PropertyOfferItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = resolveLocalizedString(item?.title as never, locale)?.trim() ?? '';
    if (!title) continue;
    const key = (item as { _key?: string })._key ?? (item as { _id?: string })._id ?? `offer-${i}`;
    result.push({
      key: String(key),
      title,
      iconKey: pickIconKey(item),
      customIconUrl: pickCustomIconUrl(item),
      customIconAlt: pickCustomIconAlt(item),
    });
  }
  return result;
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
  /** @legacy Fallback string when price is missing. Prefer price + formatFromEur. */
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
