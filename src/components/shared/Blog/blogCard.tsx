import React from "react";
import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** Supports both legacy Blog shape and Sanity BlogListItem. */
type BlogCardInput = {
  title?: string;
  slug?: string;
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
    const date = blog.date ?? blog.publishedAt ?? '';
    const tag = blog.tag ?? blog.categoryLabel ?? '';
    const t = await getTranslations('Shared.blogCard');
    if (!slug) return null;
    return (
        <Link href={`/${locale}/blogs/${slug}`} aria-label={t('ariaLabel')} className="gap-4 group">
            <div className="overflow-hidden rounded-2xl flex-shrink-0">
                <Image
                    src={coverImage || '/images/placeholder.jpg'}
                    alt={t('imageAlt')}
                    className="transition group-hover:scale-110"
                    width={190}
                    height={163}
                    style={{ width: "100%", height: "100%" }}
                    unoptimized={true}
                />
            </div>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="mt-2 text-xl font-medium text-dark dark:text-white group-hover:text-primary">
                        {title}
                    </h3>
                    <span className="text-base font-medium dark:text-white/50 text-dark/50 leading-loose">
                        {format(new Date(date), "MMM dd, yyyy")}
                    </span>
                </div>
                <div className="py-2.5 px-5 bg-dark/5 rounded-full dark:bg-white/15">
                    <p className="text-sm font-semibold text-dark dark:text-white">{tag}</p>
                </div>
            </div>
        </Link>
    );
};

export default BlogCard;
