import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import type { SeaFlatRow } from '@/lib/seaFlats/facts';
import { SEA_FLATS_MAX_METERS, SEA_FLATS_TYPES } from '@/lib/seaFlats/config';

export type SeaFlatsRows = {
  /** Every live flat by the sea, one light row each. */
  sea: SeaFlatRow[];
  /** Every live flat for sale, by the sea or not. */
  totalFlats: number;
};

const FLAT_FILTER = `_type == "property" && ${PUBLISHED_PROPERTY_FILTER} &&
      status == "sale" && !defined(duplicateOf) &&
      type->slug.current in $types && defined(price) && price > 0`;

/**
 * The flats by the sea (within `SEA_FLATS_MAX_METERS` as the listing states,
 * or on the first line) with what the figures, the city table and the
 * ranking need, plus the count of every flat for the "x of y" line. The
 * cards of the dozen that are shown are read afterwards by id through the
 * German hub's card query, which uses the same filter.
 */
export const fetchSeaFlats = sanityCache(
  async (): Promise<SeaFlatsRows> => {
    const client = getClient();
    if (!client) return { sea: [], totalFlats: 0 };
    const query = `{
      "sea": *[${FLAT_FILTER} && defined(area) &&
        (beachfront == true || (defined(seaDistanceMeters) && seaDistanceMeters <= $maxSea))]{
        _id, "slug": slug.current, price, priceUnit, area, beachfront,
        "citySlug": city->slug.current, "cityTitle": city->title, "country": city->country->slug.current,
        "mainImageUrl": gallery[0].asset->url
      },
      "totalFlats": count(*[${FLAT_FILTER}])
    }`;
    try {
      const out = await client.fetch<SeaFlatsRows>(query, { types: SEA_FLATS_TYPES, maxSea: SEA_FLATS_MAX_METERS });
      return {
        sea: Array.isArray(out?.sea) ? out.sea.filter((r) => typeof r.slug === 'string' && r.slug.length > 0) : [],
        totalFlats: typeof out?.totalFlats === 'number' ? out.totalFlats : 0,
      };
    } catch (err) {
      console.warn('[Sanity] fetchSeaFlats failed:', err);
      return { sea: [], totalFlats: 0 };
    }
  },
  ['sanity-sea-flats-rows'],
  { revalidate: 3600, tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType] },
);
