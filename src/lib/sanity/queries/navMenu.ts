import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';

/**
 * Small, cached reads behind the header menus. The header renders on every
 * page, so each is one GROQ query per hour, shared by all locales: the
 * localisation happens in the caller.
 */

export type NavGuidePost = {
  slug: string;
  title?: Record<string, string> | null;
  publishedAt?: string;
  categories?: (string | null)[] | null;
};

/**
 * Every published post's slug, title, date and category slugs, newest first:
 * enough to count the Guides menu's topics and to list the latest articles.
 * Same "published" predicate as the blog listing, so the counts match it.
 */
export async function fetchNavGuidePosts(): Promise<NavGuidePost[]> {
  return sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const query = `*[_type == "blogPost" && defined(slug.current) && defined(publishedAt) && publishedAt <= now()]
        | order(publishedAt desc) {
          "slug": slug.current,
          title,
          publishedAt,
          "categories": categories[]->slug.current
        }`;
      try {
        const rows = await client.fetch<NavGuidePost[]>(query);
        return Array.isArray(rows) ? rows : [];
      } catch (err) {
        console.warn('[Sanity] fetchNavGuidePosts failed:', err);
        return [];
      }
    },
    ['sanity-nav-guide-posts'],
    { revalidate: 3600, tags: [SANITY_TAGS.blogPost, SANITY_TAGS.blogCategory] },
  )();
}

export type NavPropertyType = { slug: string; count: number };

/** Property types with public listings, largest first. */
export async function fetchNavPropertyTypes(): Promise<NavPropertyType[]> {
  return sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const query = `*[_type == "propertyType" && defined(slug.current) && active != false] {
        "slug": slug.current,
        "count": count(*[_type == "property" && type._ref == ^._id && ${PUBLISHED_PROPERTY_FILTER}])
      }[count > 0] | order(count desc, slug asc)`;
      try {
        const rows = await client.fetch<NavPropertyType[]>(query);
        return Array.isArray(rows) ? rows.filter((r) => typeof r.slug === 'string' && r.count > 0) : [];
      } catch (err) {
        console.warn('[Sanity] fetchNavPropertyTypes failed:', err);
        return [];
      }
    },
    ['sanity-nav-property-types'],
    { revalidate: 3600, tags: [SANITY_TAGS.propertyType, SANITY_TAGS.property] },
  )();
}
