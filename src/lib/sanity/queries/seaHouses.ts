import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import { HUB_CARD_PROJECTION, type GermanHubSeaListing } from './germanHub';
import type { HouseRow } from '@/lib/seaHouses/facts';
import { SEA_HOUSES_TYPES } from '@/lib/seaHouses/config';

/** A card's fields for the houses the page shows: the same projection as the hubs. */
export type SeaHouseListing = GermanHubSeaListing;

const HOUSE_FILTER = `_type == "property" && ${PUBLISHED_PROPERTY_FILTER} &&
      status == "sale" && !defined(duplicateOf) &&
      type->slug.current in $types`;

const HOUSE_PARAMS = { types: SEA_HOUSES_TYPES };

/**
 * Every live house and villa for sale, one light row each: what the figures,
 * the district table and the card ranking need. The cards of the dozen that
 * are shown are read afterwards by id.
 */
export const fetchHouses = sanityCache(
  async (): Promise<HouseRow[]> => {
    const client = getClient();
    if (!client) return [];
    const query = `*[${HOUSE_FILTER}]{
      _id, "slug": slug.current, price, priceUnit, area,
      seaDistanceMeters, beachfront,
      "citySlug": city->slug.current, "cityTitle": city->title,
      "districtSlug": district->slug.current, "districtTitle": district->title,
      "mainImageUrl": gallery[0].asset->url
    }`;
    try {
      const rows = await client.fetch<HouseRow[]>(query, HOUSE_PARAMS);
      return Array.isArray(rows) ? rows.filter((r) => typeof r.slug === 'string' && r.slug.length > 0) : [];
    } catch (err) {
      console.warn('[Sanity] fetchHouses failed:', err);
      return [];
    }
  },
  ['sanity-sea-houses-rows'],
  { revalidate: 3600, tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType] },
);

/** The cards of the selected houses, in the order of `ids`; a house gone since the ranking drops out. */
export const fetchHouseCards = sanityCache(
  async (ids: readonly string[]): Promise<SeaHouseListing[]> => {
    const client = getClient();
    if (!client || ids.length === 0) return [];
    try {
      const rows = await client.fetch<SeaHouseListing[]>(`*[${HOUSE_FILTER} && _id in $ids] ${HUB_CARD_PROJECTION}`, {
        ...HOUSE_PARAMS,
        ids: [...ids],
      });
      if (!Array.isArray(rows)) return [];
      const byId = new Map(rows.map((r) => [r._id, r]));
      return ids.flatMap((id) => {
        const row = byId.get(id);
        return row && typeof row.slug === 'string' && row.slug.length > 0 ? [row] : [];
      });
    } catch (err) {
      console.warn('[Sanity] fetchHouseCards failed:', err);
      return [];
    }
  },
  ['sanity-sea-houses-cards'],
  { revalidate: 3600, tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType] },
);
