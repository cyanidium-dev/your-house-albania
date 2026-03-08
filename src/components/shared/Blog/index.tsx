import React from 'react';
import BlogCard from '@/components/shared/Blog/blogCard';
import { getBlogPosts } from '@/data/blog';
import { Icon } from "@iconify/react";
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

interface Blog {
    title: string;
    date: string;
    excerpt: string;
    coverImage: string;
    slug: string;
    detail: string;
    tag: string;
}

const BlogSmall: React.FC<{ locale: string }> = async ({ locale }) => {
  const t = await getTranslations('Home.blog');
    // Get all posts and map over them to ensure each field is a string
    const posts: Blog[] = getBlogPosts(["title", "date", "excerpt", "coverImage", "slug", "tag"])
        .map(item => ({
            title: typeof item.title === 'string' ? item.title : String(item.title),
            date: typeof item.date === 'string' ? item.date : String(item.date),
            excerpt: typeof item.excerpt === 'string' ? item.excerpt : String(item.excerpt),
            coverImage: typeof item.coverImage === 'string' ? item.coverImage : String(item.coverImage),
            slug: typeof item.slug === 'string' ? item.slug : String(item.slug),
            detail: typeof item.detail === 'string' ? item.detail : String(item.detail),
            tag: typeof item.tag === 'string' ? item.tag : String(item.tag),
        }))
        .slice(0, 3);

    return (
        <section>
            <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
                <div className='flex justify-between md:items-end items-start mb-10 md:flex-row flex-col'>
                    <div>
                        <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2">
                            <Icon icon="ph:house-simple-fill" className="text-2xl text-primary" aria-label="Home icon" />
                            {t('badge')}
                        </p>
                        <h2 className="lg:text-52 text-40 font-medium dark:text-white">
                            {t('title')}
                        </h2>
                        <p className='text-dark/50 dark:text-white/50 text-xm'>
                            {t('description')}
                        </p>
                    </div>
                    <Link href={`/${locale}/blogs`} className='bg-dark dark:bg-white text-white dark:text-dark py-4 px-8 rounded-full hover:bg-primary duration-300' aria-label="Read all blog articles">
                        {t('readAllArticles')}
                    </Link>
                </div>
                <div className="grid sm:grid-cols-2 grid-cols-1 lg:grid-cols-3 gap-12">
                    {posts.map((blog, i) => (
                        <div key={i} className="w-full">
                            <BlogCard blog={blog} locale={locale} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default BlogSmall;
