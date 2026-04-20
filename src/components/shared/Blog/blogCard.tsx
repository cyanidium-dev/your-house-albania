import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
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
  featured?: boolean;
  readMoreLabel?: string;
};

async function BlogCard({ blog, locale }: { blog: BlogCardInput; locale: string }) {
  const title = blog.title ?? "";
  const slug = blog.slug ?? "";
  const coverImage = blog.coverImage ?? blog.coverImageUrl ?? "";
  const dateRaw = blog.date ?? blog.publishedAt;
  const hasValidDate =
    typeof dateRaw === "string" &&
    dateRaw.trim() !== "" &&
    !Number.isNaN(new Date(dateRaw).getTime());
  const formattedDate =
    hasValidDate && dateRaw ? formatBlogDate(new Date(dateRaw), locale) : null;
  const tag = blog.tag ?? blog.categoryLabel ?? "";
  const t = await getTranslations("Shared.blogCard");
  if (!slug) return null;

  const articleUrl = `/${locale}/blog/${slug}`;
  const readMore = blog.readMoreLabel?.trim() || t("readMore");

  const categoryPill = tag
    ? blog.categorySlug
      ? (
        <Link
          href={`/${locale}/blog?category=${encodeURIComponent(blog.categorySlug)}`}
          className="inline-flex items-center py-2 px-4 bg-dark/5 dark:bg-white/15 rounded-full hover:bg-primary/10 active:bg-primary/15 transition-colors shrink-0 w-fit"
        >
          <span className="text-sm font-semibold text-dark dark:text-white">
            {tag}
          </span>
        </Link>
      )
      : (
        <span className="inline-flex items-center py-2 px-4 bg-dark/5 dark:bg-white/15 rounded-full shrink-0 w-fit">
          <span className="text-sm font-semibold text-dark/70 dark:text-white/70">
            {tag}
          </span>
        </span>
      )
    : null;

  return (
    <article
      className="flex flex-col gap-4 group"
      data-featured={blog.featured ? "true" : undefined}
    >
      <Link
        href={articleUrl}
        aria-label={t("ariaLabel")}
        className="block relative overflow-hidden rounded-2xl aspect-video w-full bg-dark/5 dark:bg-white/10"
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={t("imageAlt")}
            className="transition-transform duration-700 group-hover:scale-[1.05] object-cover"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={true}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-dark/30 dark:text-white/30"
            aria-hidden
          >
            <Icon icon="ph:image" width={32} height={32} />
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-3 min-w-0">
        {(categoryPill || formattedDate || (blog.readingTimeMinutes ?? 0) > 0) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-dark/55 dark:text-white/55">
            {categoryPill}
            {formattedDate ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon
                  icon="ph:calendar-blank"
                  width={14}
                  height={14}
                  aria-hidden
                  className="opacity-70"
                />
                {formattedDate}
              </span>
            ) : null}
            {blog.readingTimeMinutes != null && blog.readingTimeMinutes > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon
                  icon="ph:clock"
                  width={14}
                  height={14}
                  aria-hidden
                  className="opacity-70"
                />
                {t("minRead", { count: blog.readingTimeMinutes })}
              </span>
            ) : null}
          </div>
        )}

        <Link
          href={articleUrl}
          aria-label={t("ariaLabel")}
          className="block min-w-0"
        >
          <h3 className="text-lg sm:text-xl font-medium text-dark dark:text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          {(blog.excerpt ?? "").trim() && (
            <p className="mt-2 text-sm text-dark/70 dark:text-white/70 line-clamp-2">
              {blog.excerpt?.trim()}
            </p>
          )}
        </Link>

        <Link
          href={articleUrl}
          aria-label={t("ariaLabel")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-dark dark:hover:text-white transition-colors w-fit"
        >
          {readMore}
          <Icon
            icon="ph:arrow-right"
            width={16}
            height={16}
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}

export default BlogCard;
