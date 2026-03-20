import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatBlogDate } from "@/lib/date/formatLocale";

/** Supports both legacy Blog shape and Sanity BlogListItem. */
type BlogCardInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  readingTimeMinutes?: number;
  coverImage?: string;
  coverImageUrl?: string;
  date?: string;
  publishedAt?: string;
  tag?: string;
  categoryLabel?: string;
  categorySlug?: string;
};

async function BlogCard({ blog, locale }: { blog: BlogCardInput; locale: string }) {
    const title = blog.title ?? '';
    const slug = blog.slug ?? '';
    const coverImage = blog.coverImage ?? blog.coverImageUrl ?? '';
    const dateRaw = blog.date ?? blog.publishedAt;
    const hasValidDate =
      typeof dateRaw === "string" &&
      dateRaw.trim() !== "" &&
      !Number.isNaN(new Date(dateRaw).getTime());
    const formattedDate =
      hasValidDate && dateRaw
        ? formatBlogDate(new Date(dateRaw), locale)
        : null;
    const tag = blog.tag ?? blog.categoryLabel ?? '';
    const t = await getTranslations('Shared.blogCard');
    if (!slug) return null;
    const categoryPill = tag && (
      blog.categorySlug ? (
        <Link
          href={`/${locale}/blogs?category=${encodeURIComponent(blog.categorySlug)}`}
          className="order-1 sm:order-2 py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15 hover:bg-primary/10 active:bg-primary/15 transition-colors shrink-0 w-fit"
        >
          <span className="text-sm font-semibold text-dark dark:text-white">{tag}</span>
        </Link>
      ) : (
        <div className="order-1 sm:order-2 py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15 shrink-0 w-fit opacity-75 cursor-default">
          <span className="text-sm font-semibold text-dark/70 dark:text-white/70">{tag}</span>
        </div>
      )
    );
    const articleUrl = `/${locale}/blogs/${slug}`;
    return (
        <div className="flex flex-col gap-4 group">
            <Link href={articleUrl} aria-label={t('ariaLabel')} className="block">
                <div className="overflow-hidden rounded-2xl flex-shrink-0 aspect-video w-full bg-dark/5 dark:bg-white/10">
                    {coverImage ? (
                        <Image
                            src={coverImage}
                            alt={t('imageAlt')}
                            className="transition group-hover:scale-110 object-cover w-full h-full"
                            width={190}
                            height={163}
                            style={{ width: "100%", height: "100%" }}
                            unoptimized={true}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-dark/30 dark:text-white/30" aria-hidden>
                            <span className="text-sm font-medium">—</span>
                        </div>
                    )}
                </div>
            </Link>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <Link href={articleUrl} aria-label={t('ariaLabel')} className="order-2 sm:order-1 min-w-0 flex-1 block">
                    <h3 className="text-lg sm:text-xl font-medium text-dark dark:text-white group-hover:text-primary">
                        {title}
                    </h3>
                    {(blog.excerpt ?? "").trim() && (
                        <p className="mt-1 text-sm text-dark/70 dark:text-white/70 line-clamp-2">
                            {blog.excerpt?.trim()}
                        </p>
                    )}
                    {blog.readingTimeMinutes != null && blog.readingTimeMinutes > 0 && (
                        <span className="mt-1 block text-sm text-dark/60 dark:text-white/60">
                            {t('minRead', { count: blog.readingTimeMinutes })}
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
                        {t('readMore')}
                    </span>
                </Link>
                {categoryPill}
            </div>
        </div>
    );
};

export default BlogCard;
