import React from "react";
import Image from "next/image";
import { Blog } from "@/types/blog";
import { format } from "date-fns";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

async function BlogCard({ blog, locale }: { blog: Blog; locale: string }) {
    const { title, coverImage, date, slug, tag } = blog;
    const t = await getTranslations('Shared.blogCard');
    return (
        <Link href={`/${locale}/blogs/${slug}`} aria-label={t('ariaLabel')} className="gap-4 group">
            <div className="overflow-hidden rounded-2xl flex-shrink-0">
                <Image
                    src={coverImage!}
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
