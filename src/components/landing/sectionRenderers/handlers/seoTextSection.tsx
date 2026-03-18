import * as React from 'react'
import { SeoTextSection } from '@/components/landing/sections'
import { resolveRichTextDataFromContent } from '../helpers'
import type { SectionHandler } from './types'

export const seoTextSectionHandler: SectionHandler = ({ locale, section }) => {
  const seoTextData = resolveRichTextDataFromContent(section.content, locale)
  return <SeoTextSection key={section._key ?? 'seoText'} seoTextData={seoTextData} />
}

