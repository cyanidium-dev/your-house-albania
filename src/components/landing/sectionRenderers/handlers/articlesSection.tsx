import * as React from 'react'
import { ArticlesSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'
import { resolveLocalizedString } from '@/lib/sanity/localized'

export const articlesSectionHandler: SectionHandler = ({ locale, section }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Landing][articlesSection] debug section', {
      locale,
      key: section?._key ?? null,
      type: section?._type ?? null,
      sectionKeys: section ? Object.keys(section as any) : [],
      hasPostsArray: Array.isArray((section as any)?.posts),
      postsLen: Array.isArray((section as any)?.posts) ? (section as any).posts.length : null,
      postsFirstKeys:
        Array.isArray((section as any)?.posts) && (section as any).posts[0]
          ? Object.keys((section as any).posts[0])
          : null,
      contentType: typeof (section as any)?.content,
      hasContentArray: Array.isArray((section as any)?.content),
      itemsIsArray: Array.isArray((section as any)?.items),
      citiesIsArray: Array.isArray((section as any)?.cities),
    })
  }
  const cmsPosts = Array.isArray((section as any)?.posts) ? (section as any).posts : undefined
  const cmsTitle = resolveLocalizedString((section as any)?.title as never, locale) || undefined
  const cmsSubtitle = resolveLocalizedString((section as any)?.subtitle as never, locale) || undefined
  const cmsCta = (section as any)?.cta
  const cmsCtaHref = cmsCta?.href
  const cmsCtaLabel = resolveLocalizedString(cmsCta?.label as never, locale) || undefined

  return (
    <ArticlesSection
      key={section._key ?? 'blog'}
      locale={locale}
      title={cmsTitle}
      subtitle={cmsSubtitle}
      cta={cmsCtaHref || cmsCtaLabel ? { href: cmsCtaHref, label: cmsCtaLabel } : undefined}
      mode={(section as any)?.mode}
      posts={cmsPosts}
      manualArticleTitles={
        Array.isArray((section as any)?.manualArticleTitles) ? (section as any).manualArticleTitles : undefined
      }
    />
  )
}

