import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { publishedPropertyFilter } from '../groq/propertyFilters';
import {
  buildPriceIndexSnapshot,
  type PriceIndexCityPlace,
  type PriceIndexListingRow,
  type PriceIndexPlace,
  type PriceIndexSnapshot,
} from '@/lib/priceIndex/snapshot';
import { PRICE_INDEX_REVALIDATE_SECONDS } from '@/lib/priceIndex/publish';

export type PriceIndexRows = {
  rows: PriceIndexListingRow[];
  cities: PriceIndexCityPlace[];
  districts: PriceIndexPlace[];
  /** When the rows were read, ISO 8601: the date every figure carries. */
  computedAt: string;
};

/**
 * The one read behind the Domlivo Price Index: every published, active sale
 * listing with what a price figure needs, plus the published cities and
 * districts to name the groups. ~1,100 listings at ~80 bytes each; titles
 * travel once per place, not once per listing.
 *
 * Cached for an hour and purged by the Sanity webhook like every listing
 * query, so the `/info` pages, the downloads and llms.txt read the same
 * snapshot and print the same date.
 */
export const fetchPriceIndexRows = sanityCache(
  async (): Promise<PriceIndexRows | null> => {
    const client = getClient();
    if (!client) return null;
    try {
      const result = await client.fetch<Omit<PriceIndexRows, 'computedAt'>>(
        `{
          "rows": *[_type == "property" && ${publishedPropertyFilter()} && status == "sale"]{
            price, priceUnit, area, "type": type->slug.current, "stage": constructionStage,
            "c": city->slug.current, "d": district->slug.current,
            bedrooms, "sea": seaDistanceMeters, "beach": beachfront,
            "amen": amenitiesRefs[]->slug.current
          },
          "cities": *[_type == "city" && isPublished != false && defined(slug.current)]{
            "slug": slug.current, title, "country": country->slug.current
          },
          "districts": *[_type == "district" && isPublished != false && defined(slug.current)]{
            "slug": slug.current, title
          }
        }`,
      );
      if (!result || !Array.isArray(result.rows)) return null;
      return {
        rows: result.rows,
        cities: Array.isArray(result.cities) ? result.cities : [],
        districts: Array.isArray(result.districts) ? result.districts : [],
        computedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('[Sanity] fetchPriceIndexRows failed:', err);
      return null;
    }
  },
  ['sanity-price-index-rows'],
  {
    revalidate: PRICE_INDEX_REVALIDATE_SECONDS,
    tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType],
  },
);

/** The Domlivo Price Index as of the last read. `null` when Sanity is unreachable. */
export async function fetchPriceIndexSnapshot(): Promise<PriceIndexSnapshot | null> {
  const data = await fetchPriceIndexRows();
  return data ? buildPriceIndexSnapshot(data) : null;
}
