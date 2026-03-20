"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { BlogListItem } from "@/lib/sanity/blogAdapter";
import { formatDateLocale } from "@/lib/date/formatLocale";

export function BlogCardClient({
  blog,
  locale,
}: {
  blog: BlogListItem;
  locale: string;
}) {
  const t = useTranslations("Shared.blogCard");
  const { title, excerpt, coverImageUrl, publishedAt, slug, categoryLabel, readingTimeMinutes } = blog;
  const hasValidDate =
    typeof publishedAt === "string" &&
    publishedAt.trim() !== "" &&
    !Number.isNaN(new Date(publishedAt).getTime());
  const formattedDate =
    hasValidDate && publishedAt
      ? formatDateLocale(new Date(publishedAt), "MMM dd, yyyy", locale)
      : null;
  if (!slug) return null;
  return (
    <Link
      href={`/${locale}/blogs/${slug}`}
      aria-label={t("ariaLabel")}
      className="gap-4 group block"
    >
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="mt-2 text-xl font-medium text-dark dark:text-white group-hover:text-primary">
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
            <span className="text-base font-medium dark:text-white/50 text-dark/50 leading-loose">
              {formattedDate}
            </span>
          )}
        </div>
        {categoryLabel && (
          <div className="py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15">
            <p className="text-sm font-semibold text-dark dark:text-white">
              {categoryLabel}
            </p>
          </div>
        )}
      </div>
      <span
        className="mt-3 inline-block py-2 px-4 rounded-full bg-primary text-white text-sm font-semibold transition-opacity group-hover:opacity-90"
        aria-hidden
      >
        {t("readMore")}
      </span>
    </Link>
  );
}
