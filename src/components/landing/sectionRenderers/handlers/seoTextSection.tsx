import * as React from 'react'
import { SeoTextSection } from '@/components/landing/sections'
import { resolveRichTextDataFromContent } from '../helpers'
import type { SectionHandler } from './types'

export const seoTextSectionHandler: SectionHandler = ({ locale, section }) => {
  const sectionWithContent = section as { content?: unknown; body?: unknown }
  const raw = sectionWithContent.content ?? sectionWithContent.body
  const seoTextData = resolveRichTextDataFromContent(raw, locale)
  return <SeoTextSection key={section._key ?? 'seoText'} seoTextData={seoTextData} />
}

