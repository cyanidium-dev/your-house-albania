"use client";

import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { BlogListItem } from "@/lib/sanity/blogAdapter";

export function BlogCardClient({
  blog,
  locale,
}: {
  blog: BlogListItem;
  locale: string;
}) {
  const t = useTranslations("Shared.blogCard");
  const { title, coverImageUrl, publishedAt, slug, categoryLabel } = blog;
  if (!slug) return null;
  return (
    <Link
      href={`/${locale}/blogs/${slug}`}
      aria-label={t("ariaLabel")}
      className="gap-4 group block"
    >
      <div className="overflow-hidden rounded-2xl flex-shrink-0">
        <Image
          src={coverImageUrl || "/images/placeholder.jpg"}
          alt={t("imageAlt")}
          className="transition group-hover:scale-110 object-cover w-full aspect-video"
          width={190}
          height={163}
          unoptimized={coverImageUrl?.startsWith("http") ?? true}
        />
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="mt-2 text-xl font-medium text-dark dark:text-white group-hover:text-primary">
            {title}
          </h3>
          <span className="text-base font-medium dark:text-white/50 text-dark/50 leading-loose">
            {format(new Date(publishedAt || 0), "MMM dd, yyyy")}
          </span>
        </div>
        {categoryLabel && (
          <div className="py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15">
            <p className="text-sm font-semibold text-dark dark:text-white">
              {categoryLabel}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
