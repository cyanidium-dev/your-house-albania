import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { bulkTouchTimestamps, contentLastmod } from '@/lib/seo/contentLastmod';
import { RESERVED_GUIDE_SLUGS } from './guides';
import { landingLastmod } from './sitemap';
import { LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG, normalizeCatalogCountrySlug } from '@/lib/routes/catalog';

/**
 * Everything `sitemap-priority.xml` needs besides the registry decisions
 * (which have their own cached fetch): the editorial pages worth a crawler's
 * first visit. Dates are ISO strings or `null`, because the cache serialises
 * the result; `null` means no trustworthy date (see `contentLastmod`).
 */
export type PrioritySitemapSources = {
  /** City editorial pages, path after `/{locale}/`; `locales` empty = every locale. */
  cityInfo: Array<{ path: string; locales: string[]; lastModified: string | null }>;
  /** Every published post with an honest date; the route picks the newest. */
  blogPosts: Array<{ slug: string; lastModified: string | null }>;
  /** Enabled guides, for the guides index: which locales have one, and when the newest changed. */
  guides: Array<{ slug: string; locales: string[]; lastModified: string | null }>;
};

type LandingRow = {
  slug?: string;
  pageType?: string;
  _updatedAt?: string;
  _createdAt?: string;
  contentUpdatedAt?: string;
  locales?: unknown;
  linkedCitySlug?: string | null;
  linkedCityCountrySlug?: string | null;
};

const localesOf = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.map((l) => (typeof l === 'string' ? l.trim().toLowerCase() : '')).filter(Boolean) : [];

const iso = (d: Date | undefined): string | null => (d ? d.toISOString() : null);

export const fetchPrioritySitemapSources = sanityCache(
  async (): Promise<PrioritySitemapSources | null> => {
    const client = getClient();
    if (!client) return null;
    const query = `{
      "landings": *[
        _type == "landingPage" &&
        enabled != false &&
        defined(slug.current) &&
        !(_id in path("drafts.**")) &&
        (!defined(seo.noIndex) || seo.noIndex != true) &&
        (
          (pageType == "city" && defined(linkedCity->slug.current) && linkedCity->isPublished != false) ||
          (pageType == "custom" && !(slug.current in $reserved))
        )
      ]{
        "slug": slug.current,
        pageType,
        _updatedAt,
        _createdAt,
        contentUpdatedAt,
        locales,
        "linkedCitySlug": linkedCity->slug.current,
        "linkedCityCountrySlug": linkedCity->country->slug.current
      },
      "posts": *[_type == "blogPost" && defined(publishedAt) && publishedAt <= now() && defined(slug.current) && (!defined(seo.noIndex) || seo.noIndex != true)]{
        "slug": slug.current,
        _updatedAt,
        publishedAt
      }
    }`;
    try {
      const result = await client.fetch<{
        landings?: LandingRow[];
        posts?: Array<{ slug?: string; _updatedAt?: string; publishedAt?: string }>;
      }>(query, { reserved: RESERVED_GUIDE_SLUGS });
      const landings = result?.landings ?? [];
      const posts = result?.posts ?? [];
      const landingBulk = bulkTouchTimestamps(landings);
      const postBulk = bulkTouchTimestamps(posts);

      const cityInfo: PrioritySitemapSources['cityInfo'] = [];
      const guides: PrioritySitemapSources['guides'] = [];
      for (const row of landings) {
        const slug = typeof row.slug === 'string' ? row.slug.trim().toLowerCase() : '';
        if (!slug) continue;
        const lastModified = iso(landingLastmod(row, landingBulk));
        if (row.pageType === 'city') {
          const city = typeof row.linkedCitySlug === 'string' ? row.linkedCitySlug.trim().toLowerCase() : '';
          if (!city) continue;
          const country = normalizeCatalogCountrySlug(
            typeof row.linkedCityCountrySlug === 'string' ? row.linkedCityCountrySlug : LEGACY_FALLBACK_CATALOG_COUNTRY_SLUG,
          );
          cityInfo.push({ path: `${country}/${city}/info`, locales: localesOf(row.locales), lastModified });
        } else if (row.pageType === 'custom') {
          guides.push({ slug, locales: localesOf(row.locales), lastModified });
        }
      }

      const blogPosts: PrioritySitemapSources['blogPosts'] = [];
      for (const row of posts) {
        const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
        if (!slug) continue;
        blogPosts.push({ slug, lastModified: iso(contentLastmod(row, postBulk, row.publishedAt)) });
      }

      return { cityInfo, blogPosts, guides };
    } catch (err) {
      console.warn('[Sanity] fetchPrioritySitemapSources failed:', err);
      return null;
    }
  },
  ['sanity-priority-sitemap-sources'],
  {
    revalidate: 3600,
    tags: [SANITY_TAGS.landingPage, SANITY_TAGS.blogPost, SANITY_TAGS.city],
  },
);
