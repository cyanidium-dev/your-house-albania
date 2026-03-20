import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatDateLocale } from "@/lib/date/formatLocale";

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
        ? formatDateLocale(new Date(dateRaw), "MMM dd, yyyy", locale)
        : null;
    const tag = blog.tag ?? blog.categoryLabel ?? '';
    const t = await getTranslations('Shared.blogCard');
    if (!slug) return null;
    return (
        <Link href={`/${locale}/blogs/${slug}`} aria-label={t('ariaLabel')} className="gap-4 group">
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
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="mt-2 text-xl font-medium text-dark dark:text-white group-hover:text-primary">
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
                        <span className="text-base font-medium dark:text-white/50 text-dark/50 leading-loose">
                            {formattedDate}
                        </span>
                    )}
                </div>
                <div className="py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15">
                    <p className="text-sm font-semibold text-dark dark:text-white">{tag}</p>
                </div>
            </div>
            <span
                className="mt-3 inline-block py-2 px-4 rounded-full bg-primary text-white text-sm font-semibold transition-opacity group-hover:opacity-90"
                aria-hidden
            >
                {t('readMore')}
            </span>
        </Link>
    );
};

export default BlogCard;
