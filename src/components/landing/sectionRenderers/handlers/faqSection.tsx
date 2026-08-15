import * as React from 'react'
import FaqSection from '@/components/landing/sections/impl/FaqSectionImpl'
import { FaqJsonLd, type FaqJsonLdItem } from '@/components/shared/FaqJsonLd'
import { isIndexingEnabled } from '@/lib/seo/envSeo'
import { portableTextToPlainText } from '@/lib/sanity/portableTextPlain'
import { resolveFaqDataFromSection } from '../helpers'
import type { SectionHandler } from './types'

export const faqSectionHandler: SectionHandler = ({ locale, section, faqJsonLd }) => {
  if (section.enabled === false) return null
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

  // FAQPage JSON-LD: same indexing gate as the rest of the SEO signals, and only
  // ONE FAQPage per page — claimed via the shared render-pass marker.
  let jsonLd: React.ReactNode = null
  if (faqJsonLd && !faqJsonLd.emitted && isIndexingEnabled() && faqData?.items?.length) {
    const items: FaqJsonLdItem[] = faqData.items.map((item) => ({
      question: item.question,
      answer:
        typeof item.answer === 'string'
          ? item.answer
          : portableTextToPlainText(item.answer),
    }))
    jsonLd = <FaqJsonLd items={items} />
    faqJsonLd.emitted = true
  }

  return (
    <React.Fragment key={section._key ?? 'faq'}>
      {jsonLd}
      <FaqSection faqData={faqData} locale={locale} />
    </React.Fragment>
  )
}

