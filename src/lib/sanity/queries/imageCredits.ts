import { getClient, sanityCache, SANITY_TAGS } from './_core';

/**
 * Attribution for one image used on the site (`imageCredit` document).
 *
 * The page these feed exists so the site can use CC BY / CC BY-SA photography
 * at all. Those licences are satisfied by the credit being *visible to the
 * reader*, and Creative Commons accepts attribution "in any reasonable manner
 * based on the medium" — for an image-heavy site, a credits page linked from
 * the footer is the standard form. Recording the credit without publishing it
 * would not satisfy anything.
 */
export type ImageCreditDoc = {
  _id: string;
  title?: string;
  author?: string;
  licence?: string;
  licenceUrl?: string;
  sourceUrl?: string;
  isStandIn?: boolean;
  standInNote?: string;
  imageUrl?: string | null;
};

/** Human labels for the schema's licence values. */
export const LICENCE_LABELS: Record<string, string> = {
  cc0: 'CC0 1.0',
  pd: 'Public domain',
  pdm: 'Public Domain Mark 1.0',
  'cc-by-4.0': 'CC BY 4.0',
  'cc-by-sa-4.0': 'CC BY-SA 4.0',
  'cc-by-3.0': 'CC BY 3.0',
  'cc-by-sa-3.0': 'CC BY-SA 3.0',
  'unsplash-pexels': 'Unsplash / Pexels licence',
};

/** Licences whose terms require the credit to be shown. */
export function requiresAttribution(licence?: string): boolean {
  return typeof licence === 'string' && licence.startsWith('cc-by');
}

/**
 * Every credit, attribution-required first so the entries that legally need to
 * be here are not buried under the ones that do not.
 */
export async function fetchImageCredits(): Promise<ImageCreditDoc[]> {
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const query = `*[_type == "imageCredit" && defined(image.asset)] {
        _id, title, author, licence, licenceUrl, sourceUrl, isStandIn, standInNote,
        "imageUrl": image.asset->url + "?w=320&h=214&fit=crop&auto=format"
      } | order(title asc)`;
      try {
        const rows = await client.fetch<ImageCreditDoc[]>(query);
        return rows.sort((a, b) => {
          const byLicence = Number(requiresAttribution(b.licence)) - Number(requiresAttribution(a.licence));
          if (byLicence !== 0) return byLicence;
          return (a.title ?? '').localeCompare(b.title ?? '');
        });
      } catch (err) {
        console.warn('[Sanity] fetchImageCredits failed:', err);
        return [];
      }
    },
    ['sanity-image-credits-v1'],
    { revalidate: 3600, tags: [SANITY_TAGS.all, SANITY_TAGS.imageCredit] },
  );
  return cached();
}
