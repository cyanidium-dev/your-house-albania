import { getClient, sanityCache, SANITY_TAGS } from './_core';
import { PUBLISHED_PROPERTY_FILTER } from '../groq/propertyFilters';
import {
  decideSeoPages,
  seoPageId,
  type SeoDecisionSourceRows,
  type SeoPageDecisionRow,
  type SeoPageKey,
} from '@/lib/seo/pages';

export type { SeoPageDecisionRow } from '@/lib/seo/pages';

/**
 * Every listing page that has inventory, with its registry decision. The
 * listing route, the facet nav and the sitemaps all read this one result, so
 * robots, internal links and sitemap entries cannot disagree.
 * `null` when the fetch failed: callers treat that as "index nothing".
 */
export const fetchSeoPageDecisions = sanityCache(
  async (): Promise<SeoPageDecisionRow[] | null> => {
    const client = getClient();
    if (!client) return null;
    const query = `{
      "cities": *[_type == "city" && isPublished != false && defined(slug.current)]{
        "citySlug": slug.current,
        "countrySlug": country->slug.current,
        "noIndex": seo.noIndex == true
      },
      "districts": *[_type == "district" && isPublished != false && defined(slug.current)]{
        "citySlug": city->slug.current,
        "districtSlug": slug.current
      },
      "catalogNoIndex": *[_type == "catalogSeoPage" && active == true && pageScope in ["city", "district"] && seo.noIndex == true]{
        pageScope,
        "citySlug": city->slug.current,
        "districtSlug": district->slug.current
      },
      "catalogSeoPages": *[_type == "catalogSeoPage" && active == true && pageScope in ["city", "district"]]{
        pageScope,
        "citySlug": city->slug.current,
        "districtSlug": district->slug.current,
        _updatedAt,
        _createdAt
      },
      "properties": *[_type == "property" && ${PUBLISHED_PROPERTY_FILTER} && defined(city->slug.current)]{
        "citySlug": city->slug.current,
        "districtSlug": district->slug.current,
        "deal": status,
        "typeSlug": type->slug.current,
        bedrooms,
        price,
        priceUnit,
        constructionStage,
        seaDistanceMeters,
        beachfront,
        "amenitySlugs": amenitiesRefs[]->slug.current,
        _updatedAt,
        _createdAt
      }
    }`;
    try {
      const result = await client.fetch<SeoDecisionSourceRows>(query);
      return decideSeoPages(result ?? {});
    } catch (err) {
      console.warn('[Sanity] fetchSeoPageDecisions failed:', err);
      return null;
    }
  },
  // The decisions depend on the code (keyword evidence, experiments, policy)
  // as much as on the data, and the Vercel data cache outlives a deployment:
  // a registry change showed as `noindex` on the listing pages for hours
  // after its deploy (French pilot 2026-10-21, Shëngjin 2026-10-22) until a
  // Sanity publish purged the tags. The deployment id in the key makes every
  // deployment compute them afresh; the sitemaps, which read other caches,
  // flipped at once and disagreed with the pages meanwhile.
  ['sanity-seo-page-decisions', process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'],
  {
    revalidate: 86400,
    tags: [SANITY_TAGS.property, SANITY_TAGS.city, SANITY_TAGS.district, SANITY_TAGS.propertyType, SANITY_TAGS.catalogSeoPage],
  },
);

/** The decision for one page, or `null` when the page has no inventory or the fetch failed. */
export async function fetchSeoPageDecision(key: SeoPageKey): Promise<SeoPageDecisionRow | null> {
  const rows = await fetchSeoPageDecisions();
  if (!rows) return null;
  const id = seoPageId(key);
  return rows.find((r) => seoPageId(r.decision.key) === id) ?? null;
}
