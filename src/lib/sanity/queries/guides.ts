import { getClient, sanityCache, SANITY_TAGS } from './_core';

export type GuideIndexEntry = {
  _id?: string;
  slug?: string;
  title?: Record<string, string> | null;
  cardDescription?: Record<string, string> | null;
  cardImage?: { asset?: { url?: string } } | null;
  _updatedAt?: string;
};

/**
 * Slugs that live at the site root and only 301 from `/guides/*`. They are
 * custom landings too, so the index has to exclude them explicitly or it would
 * advertise pages that immediately redirect away.
 * Keep in sync with GUIDES_CANONICAL_SLUG_REDIRECTS in the guides route.
 */
export const RESERVED_GUIDE_SLUGS = [
  'for-realtors',
  'contacts',
  'contactus',
  'register',
  'how-to-publish',
  'favorites',
  'cities',
  'blog',
  'catalog',
  'agent',
  'sale',
  'rent',
  'short-term-rent',
];

/** Enabled custom landings that actually live under `/guides/{slug}`. */
export async function fetchGuideIndexEntries(): Promise<GuideIndexEntry[]> {
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const query = `*[
        _type == "landingPage" &&
        pageType == "custom" &&
        enabled != false &&
        defined(slug.current) &&
        !(slug.current in $reserved) &&
        (!defined(seo.noIndex) || seo.noIndex != true)
      ] | order(coalesce(contentUpdatedAt, _updatedAt) desc) {
        _id,
        "slug": slug.current,
        title,
        cardDescription,
        cardImage { asset-> { url } },
        _updatedAt
      }`;
      try {
        return await client.fetch<GuideIndexEntry[]>(query, { reserved: RESERVED_GUIDE_SLUGS });
      } catch (err) {
        console.warn('[Sanity] fetchGuideIndexEntries failed:', err);
        return [];
      }
    },
    ['sanity-guide-index-v1'],
    { revalidate: 60, tags: [SANITY_TAGS.landingPage] },
  );
  return cached();
}
