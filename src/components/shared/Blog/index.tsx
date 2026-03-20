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

const mapCmsPostsToBlog = (raw: unknown): Blog[] | null => {
  if (!Array.isArray(raw)) return null

  const mapped: Array<Blog | null> = raw.map((item) => {
    const p = item as any

    const title = typeof p?.title === 'string' ? p.title : String(p?.title ?? '')
    const dateRaw = p?.date ?? p?.publishedAt
    const date = typeof dateRaw === 'string' ? dateRaw : String(dateRaw ?? '')
    const excerpt = typeof p?.excerpt === 'string' ? p.excerpt : String(p?.excerpt ?? '')

    const coverImageRaw = p?.coverImage
    const coverImage =
      typeof coverImageRaw === 'string'
        ? coverImageRaw
        : coverImageRaw?.asset?.url || coverImageRaw?.url || String(coverImageRaw ?? '')

    const slugRaw = p?.slug
    const slug =
      typeof slugRaw === 'string'
        ? slugRaw
        : slugRaw?.current || slugRaw?.value || String(slugRaw ?? '')

    const detail = typeof p?.detail === 'string' ? p.detail : String(p?.detail ?? '')
    const tag = typeof p?.tag === 'string' ? p.tag : String(p?.tag ?? '')

    const dateObj = new Date(date)
    if (!title || !slug || !coverImage || Number.isNaN(dateObj.getTime())) return null

    return { title, date, excerpt, coverImage, slug, detail, tag }
  })

  return mapped.filter(Boolean) as Blog[]
}

type CmsCta = { href?: string; label?: string } | undefined

const BlogSmall: React.FC<{
  locale: string
  posts?: unknown[] | undefined
  title?: string | undefined
  subtitle?: string | undefined
  cta?: CmsCta
  mode?: unknown
  manualArticleTitles?: unknown
}> = async ({ locale, posts, title, subtitle, cta }) => {
  const t = await getTranslations('Home.blog')

  const hasCmsPostsProp = posts !== undefined
  const cmsPosts = hasCmsPostsProp ? mapCmsPostsToBlog(posts) ?? [] : null

  const localPosts: Blog[] = hasCmsPostsProp
    ? []
    : getBlogPosts(['title', 'date', 'excerpt', 'coverImage', 'slug', 'tag'])
        .map((item) => ({
          title: typeof item.title === 'string' ? item.title : String(item.title),
          date: typeof item.date === 'string' ? item.date : String(item.date),
          excerpt: typeof item.excerpt === 'string' ? item.excerpt : String(item.excerpt),
          coverImage:
            typeof item.coverImage === 'string' ? item.coverImage : String(item.coverImage),
          slug: typeof item.slug === 'string' ? item.slug : String(item.slug),
          detail: typeof item.detail === 'string' ? item.detail : String(item.detail),
          tag: typeof item.tag === 'string' ? item.tag : String(item.tag),
        }))
        .slice(0, 3)

  const finalPosts = (hasCmsPostsProp ? (cmsPosts ?? []) : localPosts).slice(0, 3)

  const headerTitle = title && title.trim() ? title : t('title')
  const headerDescription = subtitle && subtitle.trim() ? subtitle : t('description')
  const ctaHref = cta?.href || `/${locale}/blogs`
  const ctaLabel = cta?.label || t('readAllArticles')

  return (
        <section className="py-16 md:py-24">
            <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
                <div className='flex justify-between md:items-end items-start mb-10 md:flex-row flex-col'>
                    <div>
                        <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2">
                            <Icon icon="ph:house-simple-fill" className="text-2xl text-primary" aria-label="Home icon" />
                            {t('badge')}
                        </p>
                        <h2 className="lg:text-52 text-40 font-medium dark:text-white">
                            {headerTitle}
                        </h2>
                        <p className='text-dark/50 dark:text-white/50 text-xm'>
                            {headerDescription}
                        </p>
                    </div>
                    <Link href={ctaHref} className='bg-dark dark:bg-white text-white dark:text-dark py-4 px-8 rounded-full hover:bg-primary duration-300' aria-label="Read all blog articles">
                        {ctaLabel}
                    </Link>
                </div>
                <div className="grid sm:grid-cols-2 grid-cols-1 lg:grid-cols-3 gap-12">
                    {finalPosts.map((blog, i) => (
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
