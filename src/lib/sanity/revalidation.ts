import { SANITY_TAGS, type SanityTag } from '@/lib/sanity/queries/_core';

/**
 * Map a mutated Sanity document `_type` to the cache tag(s) to purge.
 *
 * Each cached fetcher (see `queries/*`) declares every tag it depends on, so
 * purging the mutated document's own `_type` tag transitively busts every
 * fetcher that lists it. Example: editing a `city` → `revalidateTag('sanity:city')`
 * busts catalog filter-options, footer-cities, home and catalog property lists,
 * all of which carry the `city` tag.
 *
 * Used by the webhook (`/api/revalidate/sanity`) and by the hourly change scan
 * (`/api/cron/sanity-changes`).
 */
export const TYPE_TO_TAGS: Record<string, SanityTag[]> = {
  property: [SANITY_TAGS.property],
  propertyType: [SANITY_TAGS.propertyType],
  homePage: [SANITY_TAGS.homePage],
  landingPage: [SANITY_TAGS.landingPage],
  blogPost: [SANITY_TAGS.blogPost],
  blogCategory: [SANITY_TAGS.blogCategory],
  'blog-settings': [SANITY_TAGS.blogSettings],
  city: [SANITY_TAGS.city],
  district: [SANITY_TAGS.district],
  amenity: [SANITY_TAGS.amenity],
  country: [SANITY_TAGS.country],
  catalogSeoPage: [SANITY_TAGS.catalogSeoPage],
  siteSettings: [SANITY_TAGS.siteSettings],
  tracker: [SANITY_TAGS.tracker],
  developer: [SANITY_TAGS.developer],
  zoneMetrics: [SANITY_TAGS.zoneMetrics],
  // A fact or a source changes what the pages show *and* what the assistant
  // holds in its prompt, so both purge the article tag too: the snapshot is
  // built from all three and would otherwise keep serving the old figure.
  knowledgeArticle: [SANITY_TAGS.knowledgeArticle],
  knowledgeFact: [SANITY_TAGS.knowledgeFact, SANITY_TAGS.knowledgeArticle],
  knowledgeSource: [SANITY_TAGS.knowledgeSource, SANITY_TAGS.knowledgeArticle],
};

/** The tags to purge for a set of changed document types, without repeats. */
export function tagsForTypes(types: readonly string[]): SanityTag[] {
  return [...new Set(types.flatMap((t) => TYPE_TO_TAGS[t] ?? []))];
}
