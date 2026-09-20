import { getClient, sanityCache, SANITY_TAGS } from './_core';

/** A FAQ item as the CMS stores it: localized question, localized plain or rich answer. */
export type PlaceFaqRawItem = {
  _key?: string;
  question?: Record<string, unknown> | null;
  answer?: Record<string, unknown> | null;
};

/**
 * The questions of a place's editorial page — the city's `/info` landing or a
 * district's landing — and nothing else of it. The listing pages show them
 * under the grid; fetching the whole landing for that would deserialize every
 * section of it on each render.
 */
export async function fetchPlaceFaqItems(citySlug: string, districtSlug?: string): Promise<PlaceFaqRawItem[]> {
  const city = typeof citySlug === 'string' ? citySlug.trim().toLowerCase() : '';
  const district = typeof districtSlug === 'string' ? districtSlug.trim().toLowerCase() : '';
  if (!city) return [];

  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const match = district
        ? `pageType == "district" && linkedDistrict->slug.current == $district && linkedDistrict->city->slug.current == $city`
        : `pageType == "city" && linkedCity->slug.current == $city`;
      const query = `*[_type == "landingPage" && enabled != false && ${match}][0]
        .pageSections[_type == "faqSection" && enabled != false][0].items[]{ _key, question, answer }`;
      try {
        const rows = await client.fetch<PlaceFaqRawItem[] | null>(query, { city, district });
        return Array.isArray(rows) ? rows : [];
      } catch (err) {
        console.warn('[Sanity] fetchPlaceFaqItems failed:', err);
        return [];
      }
    },
    ['sanity-place-faq-items-v1', city, district],
    { revalidate: 3600, tags: [SANITY_TAGS.landingPage] },
  );
  return cached();
}
