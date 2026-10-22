import { getClient, sanityCache, SANITY_TAGS, REAL_IMAGE_ASSET } from './_core';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import type { CatalogProperty } from '@/types/catalog';
import type { SeaListingRow } from '@/lib/germanHub/facts';
import { GERMAN_HUB_FLAT_TYPES, GERMAN_HUB_GUIDE_SLUGS, GERMAN_HUB_SEA_MAX_METERS } from '@/lib/germanHub/config';

/** What the sea selection ranks by, one small row per candidate. */
export type GermanHubSeaCandidate = SeaListingRow & { _id: string; slug: string };

/** A card's fields (the same the catalogue projects) for the listings the hub shows. */
export type GermanHubSeaListing = CatalogProperty & { slug: string; citySlug?: string | null };

/** A listing card with everything the hub grids print; the French pilot reads the same cards. */
export const HUB_CARD_PROJECTION = `{
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
    seaDistanceMeters,
    beachfront,
    "citySlug": city->slug.current,
    "city": city-> { _id, title, "slug": slug.current },
    "district": district-> { _id, title, "slug": slug.current, "citySlug": city->slug.current },
    "type": type-> { _id, title, "slug": slug.current },
    description,
    "mainImageUrl": gallery[0].asset->url,
    "galleryUrls": gallery[].asset->url
  }`;

const SEA_FILTER = `_type == "property" && ${PUBLISHED_PROPERTY_FILTER} &&
      status == "sale" && !defined(duplicateOf) &&
      type->slug.current in $types &&
      defined(price) && price > 0 && defined(area) &&
      (beachfront == true || (defined(seaDistanceMeters) && seaDistanceMeters <= $maxSea)) &&
      defined(gallery[0].asset)`;

const SEA_PARAMS = { types: GERMAN_HUB_FLAT_TYPES, maxSea: GERMAN_HUB_SEA_MAX_METERS };

/**
 * Every live flat for sale by the sea: within `GERMAN_HUB_SEA_MAX_METERS` of
 * it as the listing states, or on the first line, with a price, an area and a
 * photograph. Only what the ranking needs (`selectSeaListings`): the full
 * cards of every candidate ran to 3.4 MB, over the 2 MB a cache entry may
 * hold, so the cards are read afterwards for the dozen that are shown.
 */
export const fetchGermanHubSeaCandidates = sanityCache(
  async (): Promise<GermanHubSeaCandidate[]> => {
    const client = getClient();
    if (!client) return [];
    const query = `*[${SEA_FILTER}]{
      _id, "slug": slug.current, price, priceUnit, area,
      "citySlug": city->slug.current, "mainImageUrl": gallery[0].asset->url
    }`;
    try {
      const rows = await client.fetch<GermanHubSeaCandidate[]>(query, SEA_PARAMS);
      return Array.isArray(rows) ? rows.filter((r) => typeof r.slug === 'string' && r.slug.length > 0) : [];
    } catch (err) {
      console.warn('[Sanity] fetchGermanHubSeaCandidates failed:', err);
      return [];
    }
  },
  ['sanity-german-hub-sea-candidates'],
  { revalidate: 86400, tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType] },
);

/** The cards of the selected listings, in the order of `ids`; the same filter, so a listing gone since the ranking drops out. */
export const fetchGermanHubSeaCards = sanityCache(
  async (ids: readonly string[]): Promise<GermanHubSeaListing[]> => {
    const client = getClient();
    if (!client || ids.length === 0) return [];
    try {
      const rows = await client.fetch<GermanHubSeaListing[]>(`*[${SEA_FILTER} && _id in $ids] ${HUB_CARD_PROJECTION}`, {
        ...SEA_PARAMS,
        ids: [...ids],
      });
      if (!Array.isArray(rows)) return [];
      const byId = new Map(rows.map((r) => [r._id, r]));
      return ids.flatMap((id) => {
        const row = byId.get(id);
        return row && typeof row.slug === 'string' && row.slug.length > 0 ? [row] : [];
      });
    } catch (err) {
      console.warn('[Sanity] fetchGermanHubSeaCards failed:', err);
      return [];
    }
  },
  ['sanity-german-hub-sea-cards'],
  { revalidate: 86400, tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType] },
);

export type GermanHubGuide = {
  slug: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  coverImage?: { alt?: string | null; asset?: { url?: string } | null } | null;
};

/**
 * The German articles the hub links (`GERMAN_HUB_GUIDE_SLUGS`), in that
 * order, with their German titles from the CMS. An article that is not
 * published, or has no German title, is left out rather than linked blind.
 */
export const fetchGermanHubGuides = sanityCache(
  async (): Promise<GermanHubGuide[]> => {
    const client = getClient();
    if (!client) return [];
    const query = `*[
      _type == "blogPost" && slug.current in $slugs &&
      defined(publishedAt) && publishedAt <= now() && defined(title.de)
    ]{
      "slug": slug.current,
      "title": title.de,
      "excerpt": excerpt.de,
      publishedAt,
      coverImage { alt, ${REAL_IMAGE_ASSET} }
    }`;
    try {
      const rows = await client.fetch<GermanHubGuide[]>(query, { slugs: GERMAN_HUB_GUIDE_SLUGS });
      if (!Array.isArray(rows)) return [];
      const bySlug = new Map(rows.map((r) => [r.slug, r]));
      return GERMAN_HUB_GUIDE_SLUGS.flatMap((slug) => {
        const row = bySlug.get(slug);
        return row && typeof row.title === 'string' && row.title.trim() ? [row] : [];
      });
    } catch (err) {
      console.warn('[Sanity] fetchGermanHubGuides failed:', err);
      return [];
    }
  },
  ['sanity-german-hub-guides'],
  { revalidate: 86400, tags: [SANITY_TAGS.blogPost] },
);
