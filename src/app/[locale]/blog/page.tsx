import BlogList from "@/components/Blog/BlogList";
import HeroSub from "@/components/shared/HeroSub";
import { BlogBreadcrumb } from "@/components/shared/BlogBreadcrumb";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  fetchBlogPostsPaginated,
  fetchBlogSettings,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { loadBlogTopicChips } from "@/lib/nav/blogTopics";
import { mapSanityBlogPostToList, type SanityListingPost } from "@/lib/sanity/blogAdapter";
import { buildBlogMetadata } from "@/lib/sanity/blogSeoAdapter";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { BLOG_PAGE_SIZE } from "@/lib/routes/blogIndex";

/**
 * `/{locale}/blog` — the first page of every post, cached.
 *
 * This route reads no `searchParams`. A URL with a query string
 * (`?topic=…`, `?category=…`, `?page=2`) is rewritten by the middleware to the sibling
 * `listing-query/blog` route, which reads it and renders per request; see
 * `src/lib/routes/listingQueryRewrite.ts`. Until 2026-09-25 this one route
 * did both, and reading the query made it the only page on the site that
 * missed the CDN on every request.
 */
type Props = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const [blogSettings, siteSettings, baseUrlRaw] = await Promise.all([
    fetchBlogSettings(),
    fetchSiteSettings(),
    getBaseUrl(),
  ]);
  const baseUrl = (baseUrlRaw || getSiteBaseUrl()).replace(/\/$/, "");

  const blogSeo = (blogSettings as { seo?: unknown })?.seo;
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo;
  const t = await getTranslations("Listing.blogs");

  const meta = buildBlogMetadata(
    blogSeo as never,
    siteDefaultSeo as never,
    locale,
    t("metaTitle"),
    t("description"),
    undefined,
    { baseUrl, pathnameForAlternates: "/blog" }
  );

  if (!isIndexingEnabled()) return meta;
  return {
    ...meta,
    alternates: { ...meta.alternates, canonical: `${baseUrl}/${locale}/blog` },
  };
}

export default async function Blog({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const topics = await loadBlogTopicChips(locale);

  const { items, totalCount } = await fetchBlogPostsPaginated({
    category: undefined,
    page: 1,
    pageSize: BLOG_PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / BLOG_PAGE_SIZE));
  const posts = items.map((p) => mapSanityBlogPostToList(p as SanityListingPost, locale));

  const [t, tBlog] = await Promise.all([getTranslations("Listing.blogs"), getTranslations("Blog")]);

  return (
    <>
      <HeroSub
        title={t("title")}
        description={t("description")}
        badge={t("badge")}
        photoKey="tirana"
        breadcrumb={<BlogBreadcrumb locale={locale} overHero />}
      />
      <BlogList
        locale={locale}
        posts={posts}
        topics={topics}
        allLabel={tBlog("filterAll")}
        filterLabel={tBlog("filterLabel")}
        currentPage={1}
        totalPages={totalPages}
      />
    </>
  );
}
