import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { getTranslations } from "next-intl/server";
import { fetchBlogPostBySlug, fetchSiteSettings } from "@/lib/sanity/client";
import { mapSanityBlogPostToDetail } from "@/lib/sanity/blogAdapter";
import { buildBlogMetadata } from "@/lib/sanity/blogSeoAdapter";
import { BlogArticleContent } from "@/components/Blog/BlogArticleContent";
import { BlogBreadcrumb } from "@/components/shared/BlogBreadcrumb";
import { computeReadingTime } from "@/lib/blog/readingTime";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { BlogCardClient } from "@/components/Blog/BlogCardClient";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  if (!post) {
    return { title: "Not Found", description: "No blog article has been found" };
  }
  const siteSettings = await fetchSiteSettings();
  const siteDefaultSeo = (siteSettings as { defaultSeo?: unknown })?.defaultSeo;
  const postSeo = (post as { seo?: unknown }).seo;
  const title = (post as { title?: unknown }).title;
  const excerpt = (post as { excerpt?: unknown }).excerpt;
  const { resolveLocalizedString } = await import("@/lib/sanity/localized");
  const fallbackTitle =
    typeof title === "object" && title !== null
      ? resolveLocalizedString(title as never, locale)
      : typeof title === "string"
        ? title
        : "Blog Post";
  const fallbackDesc =
    typeof excerpt === "object" && excerpt !== null
      ? resolveLocalizedString(excerpt as never, locale)
      : typeof excerpt === "string"
        ? excerpt
        : undefined;
  return buildBlogMetadata(
    postSeo as never,
    siteDefaultSeo as never,
    locale,
    fallbackTitle,
    fallbackDesc
  );
}

export default async function Post({ params }: Props) {
  const { locale, slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  if (!post) notFound();

  const detail = mapSanityBlogPostToDetail(post, locale);
  if (!detail) notFound();

  const readingTime = computeReadingTime(detail.contentBlocks);
  const t = await getTranslations("Shared");
  const primaryCategory = detail.categories[0];

  return (
    <>
      <section className="relative !pt-44 pb-0!">
        <div className="container max-w-8xl mx-auto md:px-0 px-4">
          <div className="mb-4">
            <BlogBreadcrumb
              locale={locale}
              categorySlug={primaryCategory?.slug}
              categoryLabel={primaryCategory?.title}
              postTitle={detail.title}
              postSlug={detail.slug}
            />
          </div>
          <div>
            <Link
              href={`/${locale}/blogs`}
              className="flex items-center gap-3 text-white bg-primary py-3 px-4 rounded-full w-fit hover:bg-dark duration-300"
            >
              <Icon icon="ph:arrow-left" width={20} height={20} />
              <span>{t("goBack")}</span>
            </Link>
            <h2 className="text-dark dark:text-white md:text-52 text-40 leading-[1.2] font-semibold pt-7">
              {detail.title}
            </h2>
            {detail.subtitle && (
              <h6 className="text-xm mt-5 text-dark dark:text-white">
                {detail.subtitle}
              </h6>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-6 mt-12">
            <div className="flex items-center gap-4">
              <Image
                src={detail.authorImageUrl || "/images/placeholder.jpg"}
                alt=""
                className="bg-no-repeat bg-contain inline-block rounded-full !w-12 !h-12 object-cover"
                width={48}
                height={48}
                quality={100}
                unoptimized={detail.authorImageUrl?.startsWith("http") ?? true}
              />
              <div>
                <span className="text-xm text-dark dark:text-white">
                  {detail.authorName || "—"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-7">
              <div className="flex items-center gap-4">
                <Icon icon="ph:clock" width={20} height={20} />
                <span className="text-base text-dark font-medium dark:text-white">
                  {format(new Date(detail.publishedAt || 0), "MMM dd, yyyy")}
                </span>
              </div>
              {readingTime > 0 && (
                <span className="text-base text-dark/70 dark:text-white/70">
                  {readingTime} min read
                </span>
              )}
              {detail.categoryLabel && (
                <div className="py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15">
                  <p className="text-sm font-semibold text-dark dark:text-white">
                    {detail.categoryLabel}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {detail.coverImageUrl && (
          <div className="z-20 mt-12 overflow-hidden rounded container max-w-8xl mx-auto md:px-0 px-4">
            <Image
              src={detail.coverImageUrl}
              alt={detail.coverImageAlt || detail.title}
              width={1170}
              height={766}
              quality={100}
              className="h-full w-full object-cover object-center rounded-3xl"
              unoptimized={detail.coverImageUrl.startsWith("http")}
            />
          </div>
        )}
      </section>
      <section className="pt-12!">
        <div className="container max-w-8xl mx-auto px-4">
          <div className="-mx-4 flex flex-wrap justify-center">
            <div className="xl:pr-10">
              <BlogArticleContent content={detail.contentBlocks} locale={locale} />
            </div>
          </div>
        </div>
      </section>
      {detail.relatedPosts.length > 0 && (
        <section className="pt-12 pb-16">
          <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
            <h3 className="text-dark dark:text-white text-xl font-semibold mb-8">
              Related articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {detail.relatedPosts.map((p) => (
                <BlogCardClient key={p.slug} blog={p} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}
      {detail.properties.length > 0 && (
        <section className="pt-8 pb-16">
          <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
            <h3 className="text-dark dark:text-white text-xl font-semibold mb-8">
              Related properties
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {detail.properties.map((item) => (
                <PropertyCard
                  key={item.slug}
                  item={item}
                  locale={locale}
                  view="large"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
