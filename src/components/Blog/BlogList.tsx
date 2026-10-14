import React from "react";
import BlogCard from "@/components/shared/Blog/blogCard";
import { NumberedPagination } from "@/components/shared/NumberedPagination";
import type { BlogListItem } from "@/lib/sanity/blogAdapter";
import Link from "@/components/shared/Link";

type FilterChip = { key: string; label: string; href: string; count?: number };

type BlogListProps = {
  locale: string;
  posts: BlogListItem[];
  /** Guide topics with posts (src/data/guideTopics.ts), the same as the header's Guides menu. */
  topics: FilterChip[];
  /** `?topic=` when it names one of `topics`. */
  currentTopic?: string;
  /**
   * A raw CMS category from an old `?category=` link (article pills,
   * breadcrumbs): shown as the active chip so the page says what it filters.
   */
  legacyCategory?: { slug: string; label: string };
  allLabel: string;
  filterLabel: string;
  currentPage: number;
  totalPages: number;
};

const chipClass = (active: boolean) =>
  `inline-flex min-h-11 items-center gap-2 py-2 px-5 rounded-full text-sm font-semibold transition-colors ${
    active
      ? "bg-primary text-white"
      : "bg-dark/5 dark:bg-white/15 text-dark dark:text-white hover:bg-primary/10"
  }`;

export default function BlogList({
  locale,
  posts,
  topics,
  currentTopic,
  legacyCategory,
  allLabel,
  filterLabel,
  currentPage,
  totalPages,
}: BlogListProps) {
  const nothingSelected = !currentTopic && !legacyCategory;
  return (
    <section className="pt-0!">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {topics.length > 0 && (
          <nav aria-label={filterLabel} className="mb-8">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={`/${locale}/blog`}
                  className={chipClass(nothingSelected)}
                  aria-current={nothingSelected ? "page" : undefined}
                >
                  {allLabel}
                </Link>
              </li>
              {topics.map((topic) => {
                const active = currentTopic === topic.key;
                return (
                  <li key={topic.key}>
                    <Link href={topic.href} className={chipClass(active)} aria-current={active ? "page" : undefined}>
                      {topic.label}
                      {typeof topic.count === "number" ? (
                        <span className={`tabular-nums text-xs ${active ? "text-white/80" : "text-dark/50 dark:text-white/55"}`}>
                          {topic.count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
              {legacyCategory ? (
                <li>
                  <Link
                    href={`/${locale}/blog?category=${encodeURIComponent(legacyCategory.slug)}`}
                    className={chipClass(true)}
                    aria-current="page"
                  >
                    {legacyCategory.label}
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
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
                  categorySlug: blog.categorySlug,
                  featured: blog.featured,
                }}
                locale={locale}
              />
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <NumberedPagination
            currentPage={currentPage}
            totalPages={totalPages}
            keepParams={{ topic: currentTopic, category: legacyCategory?.slug }}
          />
        )}
        <div className="h-16 md:h-20" aria-hidden />
      </div>
    </section>
  );
}
