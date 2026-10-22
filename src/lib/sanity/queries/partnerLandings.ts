import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import type { CatalogProperty } from '@/types/catalog';
import type { PartnerListingRow } from '@/lib/partnerLandings/facts';
import { PARTNER_LANDING_TYPES, PARTNER_SLUG, type PartnerLanding } from '@/lib/partnerLandings/config';

/**
 * A card's fields (the same the catalogue projects) plus what the landing's
 * facts need: the sea distance, the stage, the pin level, the English text
 * for the complex names and the first photograph's width for the hero.
 */
export type PartnerLandingListing = CatalogProperty & PartnerListingRow & { slug: string };

const PROJECTION = `{
    _id,
    _type,
    title,
    "slug": slug.current,
    localizedSlug,
    price,
    priceUnit,
    area,
    plotArea,
    bedrooms,
    bathrooms,
    yearBuilt,
    status,
    promoted,
    promotionType,
    featuredOrder,
    discountPercent,
    investment,
    constructionStage,
    handoverYear,
    handoverQuarter,
    documentation,
    coordinatesLat,
    coordinatesLng,
    locationPrecision,
    locationLevel,
    seaDistanceMeters,
    beachfront,
    "createdAt": _createdAt,
    "typeSlug": type->slug.current,
    "galleryCount": count(gallery),
    "textEn": coalesce(title.en, "") + " " + coalesce(description.en, ""),
    "heroImageUrl": gallery[0].asset->url,
    "heroImageWidth": gallery[0].asset->metadata.dimensions.width,
    "city": city-> { _id, title, "slug": slug.current },
    "district": district-> { _id, title, "slug": slug.current, "citySlug": city->slug.current },
    "type": type-> { _id, title, "slug": slug.current },
    description,
    "mainImageUrl": gallery[0].asset->url,
    "galleryUrls": gallery[].asset->url
  }`;

const cachedFetch = sanityCache(
  async (city: string, district: string | null): Promise<PartnerLandingListing[]> => {
    const client = getClient();
    if (!client) return [];
    const placeFilter = district ? 'district->slug.current == $district' : 'true';
    const query = `*[
      _type == "property" && ${PUBLISHED_PROPERTY_FILTER} &&
      status == "sale" && !defined(duplicateOf) &&
      agent->slug.current == $agent &&
      city->slug.current == $city && ${placeFilter} &&
      type->slug.current in $types
    ] | order(_createdAt desc) ${PROJECTION}`;
    try {
      const rows = await client.fetch<PartnerLandingListing[]>(query, {
        agent: PARTNER_SLUG,
        city,
        district: district ?? '',
        types: PARTNER_LANDING_TYPES,
      });
      return Array.isArray(rows) ? rows.filter((r) => typeof r.slug === 'string' && r.slug.length > 0) : [];
    } catch (err) {
      console.warn('[Sanity] fetchPartnerPlaceListings failed:', err);
      return [];
    }
  },
  ['sanity-partner-place-listings'],
  {
    revalidate: 86400,
    tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType],
  },
);

/**
 * The partner's live sale flats in a landing's place, newest first. A complex
 * page narrows this in `selectPartnerListings`; the cache key is the place,
 * so Plazh and the Tocak page share one read.
 */
export async function fetchPartnerPlaceListings(landing: PartnerLanding): Promise<PartnerLandingListing[]> {
  return cachedFetch(landing.place.city, landing.place.district ?? null);
}
