import { createClient } from '@sanity/client';
import { unstable_cache } from 'next/cache';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';

export function getClient() {
  if (!projectId) return null;
  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: process.env.NODE_ENV === 'production',
  });
}

/**
 * Cache tags for Sanity-backed fetchers, keyed by Sanity document `_type`.
 *
 * Webhook invalidation contract:
 *   A Sanity webhook (or revalidation route) should, for a mutated document of
 *   `_type === T`, call `revalidateTag(SANITY_TAGS[T])` (or the raw `sanity:T`
 *   string). To purge everything, call `revalidateTag(SANITY_TAGS.all)` — every
 *   cached fetcher carries the `all` tag in addition to its specific tags.
 *
 * The webhook route lives at `src/app/api/revalidate/sanity/route.ts`
 * (`POST /api/revalidate/sanity`); these tags are the surface it targets.
 * Entries also expire via their `revalidate` window. The editor save route
 * invalidates by path separately.
 */
export const SANITY_TAGS = {
  all: 'sanity:all',
  property: 'sanity:property',
  propertyType: 'sanity:propertyType',
  homePage: 'sanity:homePage',
  landingPage: 'sanity:landingPage',
  blogPost: 'sanity:blogPost',
  blogCategory: 'sanity:blogCategory',
  blogSettings: 'sanity:blog-settings',
  city: 'sanity:city',
  district: 'sanity:district',
  amenity: 'sanity:amenity',
  country: 'sanity:country',
  catalogSeoPage: 'sanity:catalogSeoPage',
  siteSettings: 'sanity:siteSettings',
  tracker: 'sanity:tracker',
  developer: 'sanity:developer',
  zoneMetrics: 'sanity:zoneMetrics',
  imageCredit: 'sanity:imageCredit',
  knowledgeArticle: 'sanity:knowledgeArticle',
  knowledgeFact: 'sanity:knowledgeFact',
  knowledgeSource: 'sanity:knowledgeSource',
} as const;

export type SanityTag = (typeof SANITY_TAGS)[keyof typeof SANITY_TAGS];

/**
 * Unified `unstable_cache` wrapper for Sanity fetchers. Applies explicit
 * `revalidate` and `tags`, always including {@link SANITY_TAGS.all} so a global
 * purge hits every cached fetcher. GROQ is unchanged — this only wraps fetching.
 */
export function sanityCache<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  keyParts: string[],
  opts: { revalidate: number; tags: SanityTag[] },
): (...args: Args) => Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate: opts.revalidate,
    tags: [SANITY_TAGS.all, ...opts.tags],
  });
}

/**
 * Image asset projection that drops the demo seed uploads.
 *
 * The seed script that bootstrapped the dataset uploaded 150 stock
 * photographs at 800×600 (`seed-district-*.jpg`, `seed-prop-*`,
 * `placeholder.jpg`): a motel sign for Blloku, a desert for Sarandë, a highland
 * cow for Gjuhadol, the Statue of Liberty for Uji i Ftohtë. Fifteen landing
 * heroes and fourteen district cards still pointed at them on 2026-09-28. A
 * seed image projects as a null asset, so the page falls back to what it shows
 * for "no photo" — the city's own photograph in a hero, the name plate on a
 * card — until a real photograph is uploaded in the Studio.
 *
 * Use as `image { ${REAL_IMAGE_ASSET}, alt }` in place of `asset-> { url }`.
 */
export const REAL_IMAGE_ASSET =
  '"asset": select(string::startsWith(asset->originalFilename, "seed-") || asset->originalFilename == "placeholder.jpg" => null, asset->{ url })';
