import * as React from 'react'
import { FaqSection } from '@/components/landing/sections'
import { resolveFaqDataFromSection } from '../helpers'
import type { SectionHandler } from './types'

export const faqSectionHandler: SectionHandler = ({ locale, section }) => {
  const faqData = resolveFaqDataFromSection(section, locale)

  if (process.env.NODE_ENV === 'development') {
    const first = faqData?.items?.[0] as any
    const ans = first?.answer
    console.log('[Landing][faqSection] resolved', {
      locale,
      key: section?._key ?? null,
      titleType: typeof (faqData as any)?.title,
      itemsCount: Array.isArray(faqData?.items) ? faqData.items.length : null,
      firstAnswerType: Array.isArray(ans) ? 'array' : typeof ans,
      firstAnswerSample:
        Array.isArray(ans) && ans[0] && typeof ans[0] === 'object'
          ? { keys: Object.keys(ans[0] as object) }
          : typeof ans === 'string'
            ? { text: ans.slice(0, 80) }
            : ans ?? null,
    })
  }

  return <FaqSection key={section._key ?? 'faq'} faqData={faqData} />
}

