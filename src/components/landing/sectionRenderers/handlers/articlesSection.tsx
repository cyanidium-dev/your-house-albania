import * as React from 'react'
import { ArticlesSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'
import { resolveLocalizedString } from '@/lib/sanity/localized'

export const articlesSectionHandler: SectionHandler = ({ locale, section }) => {
  if ((section as { enabled?: boolean } | null)?.enabled === false) return null

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

