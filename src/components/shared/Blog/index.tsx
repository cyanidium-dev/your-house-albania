import React from "react";
import BlogCard from "@/components/shared/Blog/blogCard";
import { SectionHeader } from "@/components/landing/sectionPrimitives";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { resolveLocaleHref } from "@/lib/routes/resolveLocaleHref";
import { fetchBlogPostsPaginated } from "@/lib/sanity/client";
import {
  mapSanityBlogPostToList,
  type BlogListItem,
  type SanityListingPost,
} from "@/lib/sanity/blogAdapter";

type CmsCta = { href?: string; label?: string } | undefined;

const BlogSmall: React.FC<{
  locale: string;
  posts?: unknown[] | undefined;
  title?: string | undefined;
  subtitle?: string | undefined;
  cta?: CmsCta;
  mode?: unknown;
  manualArticleTitles?: unknown;
  /** Overrides default “Read more” on cards when set (e.g. property articlesSection.cardCtaLabel). */
  cardCtaLabel?: string | undefined;
  /**
   * Property articles block: manual CMS posts only — no latest fetch, no empty section without posts.
   */
  manualOnly?: boolean | undefined;
}> = async ({
  locale,
  posts,
  title,
  subtitle,
  cta,
  mode,
  cardCtaLabel,
  manualOnly,
}) => {
  const t = await getTranslations("Home.blog");

  function hasUsableSlug(p: unknown): boolean {
    if (!p || typeof p !== "object") return false;
    const s = (p as { slug?: string | { current?: string } }).slug;
    if (typeof s === "string" && s.trim().length > 0) return true;
    if (s && typeof s === "object") {
      return ((s as { current?: string }).current ?? "").trim().length > 0;
    }
    return false;
  }

  const modeStr = String(mode ?? "").toLowerCase();

  const hasValidCmsPosts =
    Array.isArray(posts) &&
    posts.length > 0 &&
    posts.some((p) => hasUsableSlug(p));

  if (manualOnly && !hasValidCmsPosts) {
    return null;
  }

  if (
    (modeStr === "selected" || modeStr === "manual") &&
    !hasValidCmsPosts
  ) {
    return null;
  }

  let cmsPosts: BlogListItem[] = [];
  let fetchedPosts: BlogListItem[] = [];

  try {
    cmsPosts = hasValidCmsPosts
      ? (posts ?? [])
          .map((p) => {
            const post = p as SanityListingPost;
            return mapSanityBlogPostToList(post, locale);
          })
          .filter((p) => p.slug)
      : [];

    const shouldFetchLatest =
      !manualOnly &&
      (modeStr === "latest" || (!modeStr && !hasValidCmsPosts));

    fetchedPosts =
      shouldFetchLatest && !hasValidCmsPosts
        ? (await fetchBlogPostsPaginated({ page: 1, pageSize: 3 })).items.map(
            (p) => mapSanityBlogPostToList(p as SanityListingPost, locale)
          )
        : [];
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[BlogSmall] Blog data fetch failed, using empty list:", err);
    }
  }

  const finalPosts = (hasValidCmsPosts ? cmsPosts : fetchedPosts).slice(0, 3);

  if (finalPosts.length === 0) {
    return null;
  }

  const headerTitle = title?.trim() ? title : t("title");
  const headerDescription = subtitle?.trim() ? subtitle : t("description");
  const ctaHref = cta?.href ? resolveLocaleHref(cta.href, locale) : `/${locale}/blog`;
  const ctaLabel = cta?.label || t("readAllArticles");

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <SectionHeader
          variant="split"
          eyebrowText={t("badge")}
          title={headerTitle}
          subtitle={headerDescription}
          trailing={
            <Link
              href={ctaHref}
              className="bg-dark dark:bg-white text-white dark:text-dark py-4 px-8 rounded-full hover:bg-primary duration-300"
              aria-label="Read all blog articles"
            >
              {ctaLabel}
            </Link>
          }
        />
        <div className="grid sm:grid-cols-2 grid-cols-1 lg:grid-cols-3 gap-12">
          {finalPosts.map((blog) => (
            <div key={blog.slug || blog.title} className="w-full">
              <BlogCard
                blog={{
                  title: blog.title,
                  slug: blog.slug,
                  coverImageUrl: blog.coverImageUrl,
                  publishedAt: blog.publishedAt,
                  categoryLabel: blog.categoryLabel,
                  featured: blog.featured,
                  readMoreLabel: cardCtaLabel,
                }}
                locale={locale}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSmall;
