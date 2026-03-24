"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { BlogListItem } from "@/lib/sanity/blogAdapter";
import { formatBlogDate } from "@/lib/date/formatLocale";

export function BlogCardClient({
  blog,
  locale,
}: {
  blog: BlogListItem;
  locale: string;
}) {
  const t = useTranslations("Shared.blogCard");
  const {
    title,
    excerpt,
    coverImageUrl,
    publishedAt,
    slug,
    categoryLabel,
    categorySlug,
    readingTimeMinutes,
    featured,
  } = blog;
  const hasValidDate =
    typeof publishedAt === "string" &&
    publishedAt.trim() !== "" &&
    !Number.isNaN(new Date(publishedAt).getTime());
  const formattedDate =
    hasValidDate && publishedAt
      ? formatBlogDate(new Date(publishedAt), locale)
      : null;
  if (!slug) return null;
  const articleUrl = `/${locale}/blog/${slug}`;
  const categoryPill = categoryLabel && (
    categorySlug ? (
      <Link
        href={`/${locale}/blog?category=${encodeURIComponent(categorySlug)}`}
        className="order-1 sm:order-2 py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15 hover:bg-primary/10 active:bg-primary/15 transition-colors shrink-0 w-fit"
      >
        <span className="text-sm font-semibold text-dark dark:text-white">{categoryLabel}</span>
      </Link>
    ) : (
      <div className="order-1 sm:order-2 py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15 shrink-0 w-fit opacity-75 cursor-default">
        <span className="text-sm font-semibold text-dark/70 dark:text-white/70">{categoryLabel}</span>
      </div>
    )
  );
  return (
    <div
      className="flex flex-col gap-4 group"
      data-featured={featured ? "true" : undefined}
    >
      <Link href={articleUrl} aria-label={t("ariaLabel")} className="block">
        <div className="overflow-hidden rounded-2xl flex-shrink-0 aspect-video w-full bg-dark/5 dark:bg-white/10">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={t("imageAlt")}
              className="transition group-hover:scale-110 object-cover w-full h-full"
              width={190}
              height={163}
              unoptimized={coverImageUrl.startsWith("http")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-dark/30 dark:text-white/30" aria-hidden>
              <span className="text-sm font-medium">—</span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <Link href={articleUrl} aria-label={t("ariaLabel")} className="order-2 sm:order-1 min-w-0 flex-1 block">
          <h3 className="text-lg sm:text-xl font-medium text-dark dark:text-white group-hover:text-primary">
            {title}
          </h3>
          {excerpt?.trim() && (
            <p className="mt-1 text-sm text-dark/70 dark:text-white/70 line-clamp-2">
              {excerpt.trim()}
            </p>
          )}
          {readingTimeMinutes != null && readingTimeMinutes > 0 && (
            <span className="mt-1 block text-sm text-dark/60 dark:text-white/60">
              {t("minRead", { count: readingTimeMinutes })}
            </span>
          )}
          {formattedDate && (
            <span className="text-sm sm:text-base font-medium dark:text-white/50 text-dark/50 leading-loose block">
              {formattedDate}
            </span>
          )}
          <span
            className="mt-3 inline-block py-2 px-4 rounded-full bg-primary text-white text-sm font-semibold transition-opacity group-hover:opacity-90"
            aria-hidden
          >
            {t("readMore")}
          </span>
        </Link>
        {categoryPill}
      </div>
    </div>
  );
}
