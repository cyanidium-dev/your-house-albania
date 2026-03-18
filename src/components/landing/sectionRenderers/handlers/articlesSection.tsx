import * as React from 'react'
import { ArticlesSection } from '@/components/landing/sections'
import type { SectionHandler } from './types'

export const articlesSectionHandler: SectionHandler = ({ locale, section }) => {
  // Until the project has a dedicated CMS blog renderer, keep the existing blog section.
  return <ArticlesSection key={section._key ?? 'blog'} locale={locale} />
}

