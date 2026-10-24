import { getClient, sanityCache, SANITY_TAGS, REAL_IMAGE_ASSET } from './_core';
import { INVESTMENT_HUB_ARTICLES, INVESTMENT_HUB_GUIDE_SLUG } from '@/lib/investmentHub/config';

export type InvestmentHubArticle = {
  slug: string;
  /** Localized title and excerpt objects from the CMS. */
  title: unknown;
  excerpt?: unknown;
  publishedAt?: string | null;
  coverImage?: { alt?: string | null; asset?: { url?: string } | null } | null;
};

export type InvestmentHubGuide = {
  slug: string;
  title: unknown;
  locales?: string[] | null;
  noIndex?: boolean | null;
};

/**
 * The investment articles the hub shows as cards (`INVESTMENT_HUB_ARTICLES`),
 * in that order, with their titles in every language, and the investment
 * guide. A post that is not published is left out rather than linked blind.
 */
export const fetchInvestmentHubContent = sanityCache(
  async (): Promise<{ articles: InvestmentHubArticle[]; guide: InvestmentHubGuide | null }> => {
    const client = getClient();
    if (!client) return { articles: [], guide: null };
    const query = `{
      "articles": *[_type == "blogPost" && slug.current in $slugs && defined(publishedAt) && publishedAt <= now()]{
        "slug": slug.current, title, excerpt, publishedAt, coverImage { alt, ${REAL_IMAGE_ASSET} }
      },
      "guide": *[_type == "landingPage" && slug.current == $guide && !(_id in path("drafts.**"))][0]{
        "slug": slug.current, title, locales, "noIndex": seo.noIndex
      }
    }`;
    try {
      const out = await client.fetch<{ articles: InvestmentHubArticle[]; guide: InvestmentHubGuide | null }>(query, {
        slugs: INVESTMENT_HUB_ARTICLES,
        guide: INVESTMENT_HUB_GUIDE_SLUG,
      });
      const bySlug = new Map((out?.articles ?? []).map((a) => [a.slug, a]));
      return {
        articles: INVESTMENT_HUB_ARTICLES.flatMap((slug) => {
          const a = bySlug.get(slug);
          return a ? [a] : [];
        }),
        guide: out?.guide ?? null,
      };
    } catch (err) {
      console.warn('[Sanity] fetchInvestmentHubContent failed:', err);
      return { articles: [], guide: null };
    }
  },
  ['sanity-investment-hub-content'],
  { revalidate: 3600, tags: [SANITY_TAGS.blogPost, SANITY_TAGS.landingPage] },
);
