import BlogList from "@/components/Blog/BlogList";
import HeroSub from "@/components/shared/HeroSub";
import { BlogBreadcrumb } from "@/components/shared/BlogBreadcrumb";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  fetchBlogPostsPaginated,
  fetchBlogCategories,
  fetchBlogSettings,
  fetchSiteSettings,
} from "@/lib/sanity/client";
import { mapSanityBlogPostToList, type SanityListingPost } from "@/lib/sanity/blogAdapter";
import { buildBlogMetadata } from "@/lib/sanity/blogSeoAdapter";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { getSiteBaseUrl } from "@/lib/siteUrl";
import { isIndexingEnabled } from "@/lib/seo/envSeo";
import { BLOG_PAGE_SIZE } from "@/lib/routes/blogIndex";

/**
 * `/{locale}/blog` — the first page of every post, cached.
 *
 * This route reads no `searchParams`. A URL with a query string
 * (`?category=…`, `?page=2`) is rewritten by the middleware to the sibling
 * `listing-query/blog` route, which reads it and renders per request; see
 * `src/lib/routes/listingQueryRewrite.ts`. Until 2026-09-25 this one route
 * did both, and reading the query made it the only page on the site that
 * missed the CDN on every request.
 */
type Props = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 3600;

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

  const categoriesRaw = await fetchBlogCategories();

  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
        .filter((c) => c && typeof (c as { slug?: string }).slug === "string")
        .map((c) => {
          const cat = c as { slug: string; title?: unknown };
          return {
            slug: cat.slug,
            label: resolveLocalizedString(cat.title as never, locale) || cat.slug,
          };
        })
    : [];

  const { items, totalCount } = await fetchBlogPostsPaginated({
    category: undefined,
    page: 1,
    pageSize: BLOG_PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / BLOG_PAGE_SIZE));
  const posts = items.map((p) => mapSanityBlogPostToList(p as SanityListingPost, locale));

  const t = await getTranslations("Listing.blogs");

  return (
    <>
      <HeroSub
        title={t("title")}
        description={t("description")}
        badge={t("badge")}
        photoKey="tirana"
      />
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 mb-4">
        <BlogBreadcrumb locale={locale} />
      </div>
      <BlogList
        locale={locale}
        posts={posts}
        categories={categories}
        currentCategory={undefined}
        currentPage={1}
        totalPages={totalPages}
      />
    </>
  );
}
