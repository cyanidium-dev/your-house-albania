import * as React from 'react'
import { ArticlesSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'
import { resolveLocalizedString } from '@/lib/sanity/localized'

type ArticlesProps = React.ComponentProps<typeof ArticlesSection>

/** The CMS shape of an articles section, read loosely: the Studio owns the schema. */
type ArticlesSectionData = {
  enabled?: boolean
  posts?: unknown
  title?: unknown
  subtitle?: unknown
  cta?: { href?: string; label?: unknown }
  mode?: ArticlesProps['mode']
  manualArticleTitles?: unknown
}

export const articlesSectionHandler: SectionHandler = ({ locale, section }) => {
  const s = section as unknown as ArticlesSectionData | null
  if (s?.enabled === false) return null

  const cmsPosts = Array.isArray(s?.posts) ? (s.posts as ArticlesProps['posts']) : undefined
  const cmsTitle = resolveLocalizedString(s?.title as never, locale) || undefined
  const cmsSubtitle = resolveLocalizedString(s?.subtitle as never, locale) || undefined
  const cmsCta = s?.cta
  const cmsCtaHref = cmsCta?.href
  const cmsCtaLabel = resolveLocalizedString(cmsCta?.label as never, locale) || undefined

  return (
    <ArticlesSection
      key={section._key ?? 'blog'}
      locale={locale}
      title={cmsTitle}
      subtitle={cmsSubtitle}
      cta={cmsCtaHref || cmsCtaLabel ? { href: cmsCtaHref, label: cmsCtaLabel } : undefined}
      mode={s?.mode}
      posts={cmsPosts}
      manualArticleTitles={
        Array.isArray(s?.manualArticleTitles)
          ? (s.manualArticleTitles as ArticlesProps['manualArticleTitles'])
          : undefined
      }
    />
  )
}
