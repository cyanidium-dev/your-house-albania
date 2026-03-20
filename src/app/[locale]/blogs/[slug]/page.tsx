import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { getTranslations } from "next-intl/server";
import { fetchBlogPostBySlug, fetchSiteSettings } from "@/lib/sanity/client";
import { mapSanityBlogPostToDetail } from "@/lib/sanity/blogAdapter";
import { buildBlogMetadata } from "@/lib/sanity/blogSeoAdapter";
import { BlogArticleContent } from "@/components/Blog/BlogArticleContent";
import { BlogArticleSchema } from "@/components/Blog/BlogArticleSchema";
import { BlogBreadcrumb } from "@/components/shared/BlogBreadcrumb";
import { computeReadingTime } from "@/lib/blog/readingTime";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { BlogCardClient } from "@/components/Blog/BlogCardClient";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { resolveLocalizedString } from "@/lib/sanity/localized";
import { formatBlogDate } from "@/lib/date/formatLocale";

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
  const [post, siteSettings, baseUrl] = await Promise.all([
    fetchBlogPostBySlug(slug),
    fetchSiteSettings(),
    getBaseUrl(),
  ]);
  if (!post) notFound();

  const detail = mapSanityBlogPostToDetail(post, locale);
  if (!detail) notFound();

  const rawSite = siteSettings as { siteName?: unknown; logo?: { asset?: { url?: string } } } | null;
  const siteName = rawSite?.siteName
    ? (resolveLocalizedString(rawSite.siteName as never, locale) || (typeof rawSite.siteName === "string" ? rawSite.siteName : "") || "Site")
    : "Site";
  const siteLogoUrl = rawSite?.logo?.asset?.url ?? undefined;

  const readingTime = computeReadingTime(detail.contentBlocks);
  const t = await getTranslations("Shared");
  const tBlog = await getTranslations("Shared.blog");
  const tBlogCard = await getTranslations("Shared.blogCard");
  const primaryCategory = detail.categories[0];

  return (
    <>
      <BlogArticleSchema
        detail={detail}
        baseUrl={baseUrl}
        locale={locale}
        siteName={siteName}
        siteLogoUrl={siteLogoUrl}
      />
      <section className="relative !pt-24 md:!pt-28 pb-0!">
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
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8 sm:mt-12">
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
            <div className="flex flex-wrap items-center gap-3 sm:gap-7">
              <div className="flex items-center gap-4">
                <Icon icon="ph:clock" width={20} height={20} />
                <span className="text-base text-dark font-medium dark:text-white">
                  {formatBlogDate(new Date(detail.publishedAt || 0), locale)}
                </span>
              </div>
              {readingTime > 0 && (
                <span className="text-base text-dark/70 dark:text-white/70">
                  {tBlogCard("minRead", { count: readingTime })}
                </span>
              )}
              {primaryCategory && (
                <Link
                  href={`/${locale}/blogs?category=${encodeURIComponent(primaryCategory.slug)}`}
                  className="py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15 hover:bg-primary/10 transition-colors"
                >
                  <p className="text-sm font-semibold text-dark dark:text-white">
                    {primaryCategory.title}
                  </p>
                </Link>
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
      <section className="pt-12 pb-16">
        <div className="container max-w-8xl mx-auto px-4 md:px-5 2xl:px-0">
          <div
            className={
              detail.relatedPosts.length > 0 || detail.properties.length > 0
                ? "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16"
                : "max-w-3xl mx-auto"
            }
          >
            <div className="min-w-0">
              <BlogArticleContent content={detail.contentBlocks} locale={locale} />
            </div>
            {(detail.relatedPosts.length > 0 || detail.properties.length > 0) && (
              <aside className="lg:sticky lg:top-24 lg:self-start space-y-10">
                {detail.relatedPosts.length > 0 && (
                  <div>
                    <h3 className="text-dark dark:text-white text-xl font-semibold mb-6">
                      {tBlog("relatedArticles")}
                    </h3>
                    <div className="flex flex-col gap-6">
                      {detail.relatedPosts.map((p) => (
                        <BlogCardClient key={p.slug} blog={p} locale={locale} />
                      ))}
                    </div>
                  </div>
                )}
                {detail.properties.length > 0 && (
                  <div>
                    <h3 className="text-dark dark:text-white text-xl font-semibold mb-6">
                      {tBlog("relatedProperties")}
                    </h3>
                    <div className="flex flex-col gap-6">
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
                )}
              </aside>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
