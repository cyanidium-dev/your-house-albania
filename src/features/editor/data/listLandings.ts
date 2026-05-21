import 'server-only';
import { createClient } from '@sanity/client';

type LandingSummary = {
  _id: string;
  title?: string;
  slug?: string;
  pageType?: string;
  sectionCount: number;
};

function getReadClient() {
  const projectId =
    process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
  const dataset =
    process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
  const apiVersion = process.env.SANITY_API_VERSION ?? '2024-01-01';
  const token = process.env.SANITY_API_TOKEN ?? process.env.SANITY_WRITE_TOKEN;
  if (!projectId) return null;
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: 'published',
  });
}

/** All `landingPage` docs the editor can open, sorted by readable title. */
export async function listLandingsForEditor(): Promise<LandingSummary[]> {
  const client = getReadClient();
  if (!client) return [];
  try {
    const rows = await client.fetch<LandingSummary[]>(
      `*[_type == "landingPage"] | order(coalesce(pageType, ""), coalesce(slug.current, "")) {
        _id,
        pageType,
        "slug": slug.current,
        "title": coalesce(pageTitle, slug.current, _id),
        "sectionCount": count(pageSections)
      }`,
    );
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.warn('[editor/listLandings] failed:', (err as Error).message);
    return [];
  }
}
