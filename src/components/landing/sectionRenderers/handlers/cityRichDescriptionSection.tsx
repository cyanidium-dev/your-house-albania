import * as React from 'react'
import { SeoTextSection } from '@/components/landing/sections'
import { resolveRichTextDataFromContent } from '../helpers'
import type { SectionHandler } from './types'

export const cityRichDescriptionSectionHandler: SectionHandler = ({ locale, section }) => {
  // Uses the same rich text renderer as seoTextSection, but does not require it to be "SEO".
  const sectionWithContent = section as { content?: unknown; body?: unknown }
  const raw = sectionWithContent.content ?? sectionWithContent.body
  const richTextData = resolveRichTextDataFromContent(raw, locale)
  return <SeoTextSection key={section._key ?? 'cityRich'} seoTextData={richTextData} />
}

