import React from "react";
import BlogCard from "@/components/shared/Blog/blogCard";
import { PropertyPagination } from "@/components/catalog/PropertyPagination";
import type { BlogListItem } from "@/lib/sanity/blogAdapter";
import Link from "next/link";

type BlogListProps = {
  locale: string;
  posts: BlogListItem[];
  categories: { slug: string; label: string }[];
  currentCategory?: string;
  currentPage: number;
  totalPages: number;
};

export default function BlogList({
  locale,
  posts,
  categories,
  currentCategory,
  currentPage,
  totalPages,
}: BlogListProps) {
  return (
    <section className="pt-0!">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href={`/${locale}/blogs`}
              className={`py-2.5 px-5 rounded-full text-sm font-semibold transition-colors ${
                !currentCategory
                  ? "bg-primary text-white"
                  : "bg-dark/5 dark:bg-white/15 text-dark dark:text-white hover:bg-primary/10"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/blogs?category=${encodeURIComponent(cat.slug)}`}
                className={`py-2.5 px-5 rounded-full text-sm font-semibold transition-colors ${
                  currentCategory === cat.slug
                    ? "bg-primary text-white"
                    : "bg-dark/5 dark:bg-white/15 text-dark dark:text-white hover:bg-primary/10"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-12">
          {posts.map((blog) => (
            <div key={blog.slug || blog.title} className="w-full">
              <BlogCard
                blog={{
                  title: blog.title,
                  slug: blog.slug,
                  excerpt: blog.excerpt,
                  readingTimeMinutes: blog.readingTimeMinutes,
                  coverImageUrl: blog.coverImageUrl,
                  publishedAt: blog.publishedAt,
                  categoryLabel: blog.categoryLabel,
                }}
                locale={locale}
              />
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <PropertyPagination currentPage={currentPage} totalPages={totalPages} />
        )}
        <div className="h-16 md:h-20" aria-hidden />
      </div>
    </section>
  );
}
