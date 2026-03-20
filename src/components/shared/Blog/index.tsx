import React from "react";
import BlogCard from "@/components/shared/Blog/blogCard";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { fetchBlogPostsPaginated } from "@/lib/sanity/client";
import { mapSanityBlogPostToList } from "@/lib/sanity/blogAdapter";

const BlogSmall: React.FC<{ locale: string }> = async ({ locale }) => {
  const t = await getTranslations("Home.blog");
  const { items } = await fetchBlogPostsPaginated({
    page: 1,
    pageSize: 3,
  });
  const posts = items.map((p) => mapSanityBlogPostToList(p, locale));

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="flex justify-between md:items-end items-start mb-10 md:flex-row flex-col">
          <div>
            <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2">
              <Icon
                icon="ph:house-simple-fill"
                className="text-2xl text-primary"
                aria-label="Home icon"
              />
              {t("badge")}
            </p>
            <h2 className="lg:text-52 text-40 font-medium dark:text-white">
              {t("title")}
            </h2>
            <p className="text-dark/50 dark:text-white/50 text-xm">
              {t("description")}
            </p>
          </div>
          <Link
            href={`/${locale}/blogs`}
            className="bg-dark dark:bg-white text-white dark:text-dark py-4 px-8 rounded-full hover:bg-primary duration-300"
            aria-label="Read all blog articles"
          >
            {t("readAllArticles")}
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 grid-cols-1 lg:grid-cols-3 gap-12">
          {posts.map((blog) => (
            <div key={blog.slug || blog.title} className="w-full">
              <BlogCard
                blog={{
                  title: blog.title,
                  slug: blog.slug,
                  coverImageUrl: blog.coverImageUrl,
                  publishedAt: blog.publishedAt,
                  categoryLabel: blog.categoryLabel,
                }}
                locale={locale}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSmall;
