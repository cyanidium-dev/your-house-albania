import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import { HUB_CARD_PROJECTION, type GermanHubSeaListing } from './germanHub';
import { englishSlugOfDerived } from '@/lib/property/propertyUrl';
import { FRENCH_PILOT_LISTINGS } from '@/lib/frenchPilot/config';

export type FrenchPilotListing = GermanHubSeaListing & {
  districtSlug?: string | null;
  seaDistanceMeters?: number | null;
  beachfront?: boolean | null;
};

/**
 * The French pilot's listings (`FRENCH_PILOT_LISTINGS`), as cards, in the
 * config's order. They are stored by their French address, which is derived
 * from the English one, so they are read by `localizedSlug.en`. A listing
 * unpublished or sold since the pilot started drops out here; its page stays
 * up with the lifecycle label like any other.
 */
export const fetchFrenchPilotListings = sanityCache(
  async (): Promise<FrenchPilotListing[]> => {
    const client = getClient();
    if (!client) return [];
    const enSlugs = FRENCH_PILOT_LISTINGS.map(englishSlugOfDerived);
    const projection = HUB_CARD_PROJECTION.replace(
      /\}\s*$/,
      ', "districtSlug": district->slug.current, "enSlug": localizedSlug.en }',
    );
    try {
      const rows = await client.fetch<Array<FrenchPilotListing & { enSlug?: string }>>(
        `*[_type == "property" && ${PUBLISHED_PROPERTY_FILTER} && status == "sale" && localizedSlug.en in $slugs] ${projection}`,
        { slugs: enSlugs },
      );
      if (!Array.isArray(rows)) return [];
      const byEnSlug = new Map(rows.map((r) => [r.enSlug, r]));
      return enSlugs.flatMap((slug) => {
        const row = byEnSlug.get(slug);
        return row && typeof row.slug === 'string' && row.slug.length > 0 ? [row] : [];
      });
    } catch (err) {
      console.warn('[Sanity] fetchFrenchPilotListings failed:', err);
      return [];
    }
  },
  ['sanity-french-pilot-listings'],
  { revalidate: 3600, tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType] },
);
