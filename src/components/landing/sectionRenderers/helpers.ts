import type { FaqData } from '@/components/Home/FAQs'
import type { SeoTextData } from '@/components/Home/SeoText'
import type { PortableTextBlock } from '@portabletext/types'
import { resolveLocalizedContent, resolveLocalizedString } from '@/lib/sanity/localized'
import type { LandingPageDoc, LandingSectionBase } from './types'

export function asSections(doc: LandingPageDoc | null | undefined): LandingSectionBase[] {
  const arr = doc?.pageSections
  return Array.isArray(arr) ? arr : []
}

export function heroTabsFromSection(section: LandingSectionBase, locale: string) {
  const raw = section.search?.tabs
  const tabs = Array.isArray(raw) ? raw : []
  return tabs
    .filter((t) => t?.enabled === true && typeof t?.key === 'string' && t.key.trim())
    .map((t) => ({
      // CMS contract uses "shortTerm" while catalog expects "short-term".
      key: (((t.key as string) === 'shortTerm' ? 'short-term' : (t.key as string)) ?? '') as string,
      label: resolveLocalizedString(t.label as never, locale) || undefined,
    }))
}

export function resolveRichTextDataFromContent(
  content: unknown,
  locale: string,
): SeoTextData {
  let data: SeoTextData = null
  const raw = content
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const arr = resolveLocalizedContent(raw as never, locale)
    if (arr.length > 0) {
      data = { content: arr, isPlainText: false }
    } else {
      const str = resolveLocalizedString(raw as never, locale)
      if (typeof str === 'string' && str.trim()) data = { content: str, isPlainText: true }
    }
  } else if (Array.isArray(raw)) {
    const arr = resolveLocalizedContent(raw as never, locale)
    if (arr.length > 0) data = { content: arr, isPlainText: false }
  }
  return data
}

export function resolveFaqDataFromSection(
  section: LandingSectionBase,
  locale: string,
): FaqData {
  const rawItems = Array.isArray(section.items) ? section.items : []
  const itemsResolved = rawItems
    .map((item) => {
      const it = item as { question?: unknown; answer?: unknown }
      const q = resolveLocalizedString(it.question as never, locale)
      const aRaw = it.answer
      const aText =
        typeof aRaw === 'object' && aRaw !== null && !Array.isArray(aRaw)
          ? resolveLocalizedString(aRaw as never, locale)
          : ''
      const aRich = Array.isArray(aRaw) ? (resolveLocalizedContent(aRaw as never, locale) as PortableTextBlock[]) : null
      const answer: string | PortableTextBlock[] = aRich && aRich.length ? aRich : aText
      if (q || (typeof answer === 'string' ? answer : answer.length)) {
        return { question: q || '', answer }
      }
      return null
    })
    .filter((x): x is { question: string; answer: string | PortableTextBlock[] } => x !== null)

  const imageModeRaw = (section as { imageMode?: string })?.imageMode
  const imageMode: 'withImage' | 'withoutImage' | undefined =
    imageModeRaw === 'withImage' || imageModeRaw === 'withoutImage' ? imageModeRaw : undefined

  return itemsResolved.length > 0
    ? {
        title: resolveLocalizedString(section.title as never, locale) || undefined,
        items: itemsResolved,
        imageMode,
      }
    : null
}

