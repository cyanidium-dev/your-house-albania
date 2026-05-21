import 'server-only';
import { createClient } from '@sanity/client';
import { landingPageSectionsProjection } from '@/lib/sanity/client';

export type EditorLandingDoc = {
  _id: string;
  _type: string;
  pageType?: string;
  slug?: string;
  title?: string;
  pageSections?: Array<{ _key?: string; _type?: string; [k: string]: unknown }>;
  seo?: unknown;
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

/**
 * Full `landingPage` document by `_id`. Reuses the exact same section
 * projection as the public fetch path, so the editor sees identical data and
 * section handlers behave the same as on the rendered public site.
 */
export async function fetchLandingForEditor(id: string): Promise<EditorLandingDoc | null> {
  const client = getReadClient();
  if (!client) return null;

  try {
    const doc = await client.fetch<EditorLandingDoc | null>(
      `*[_id == $id && _type == "landingPage"][0] {
        _id,
        _type,
        pageType,
        "slug": slug.current,
        "title": coalesce(pageTitle, slug.current, _id),
        "pageSections": pageSections[]${landingPageSectionsProjection},
        seo
      }`,
      { id },
    );
    return doc ?? null;
  } catch (err) {
    console.warn('[editor/fetchLandingForEditor] failed:', (err as Error).message);
    return null;
  }
}
