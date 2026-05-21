import type { FaqData } from '@/components/landing/sections/impl/FaqSectionImpl'
import type { SeoTextData } from '@/components/landing/sections/impl/SeoTextSectionImpl'
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

type LocalizedCtaShape = { href?: unknown; label?: unknown } | null | undefined

function resolveLocalizedCta(
  raw: LocalizedCtaShape,
  locale: string,
): { label: string; href: string } | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const href = typeof raw.href === 'string' ? raw.href.trim() : ''
  const label = resolveLocalizedString(raw.label as never, locale)?.trim() || ''
  if (!href || !label) return undefined
  return { href, label }
}

export function resolveFaqDataFromSection(
  section: LandingSectionBase,
  locale: string,
): FaqData {
  const rawItems = Array.isArray(section.items) ? section.items : []
  const itemsResolved = rawItems
    .map((item) => {
      const it = item as { question?: unknown; answer?: unknown; tag?: unknown }
      const q = resolveLocalizedString(it.question as never, locale)
      const aRaw = it.answer
      const aText =
        typeof aRaw === 'object' && aRaw !== null && !Array.isArray(aRaw)
          ? resolveLocalizedString(aRaw as never, locale)
          : ''
      const aRich = Array.isArray(aRaw) ? (resolveLocalizedContent(aRaw as never, locale) as PortableTextBlock[]) : null
      const answer: string | PortableTextBlock[] = aRich && aRich.length ? aRich : aText
      const tag = resolveLocalizedString(it.tag as never, locale)?.trim() || undefined
      if (q || (typeof answer === 'string' ? answer : answer.length)) {
        return { question: q || '', answer, ...(tag ? { tag } : {}) }
      }
      return null
    })
    .filter((x): x is { question: string; answer: string | PortableTextBlock[]; tag?: string } => x !== null)

  const imageModeRaw = (section as { imageMode?: string })?.imageMode
  const imageMode: 'withImage' | 'withoutImage' | undefined =
    imageModeRaw === 'withImage' || imageModeRaw === 'withoutImage' ? imageModeRaw : undefined

  // Callout (optional sticky brand card next to accordion).
  const calloutRaw = (section as { callout?: unknown }).callout
  let callout: NonNullable<FaqData>['callout'] = undefined
  if (calloutRaw && typeof calloutRaw === 'object') {
    const c = calloutRaw as {
      title?: unknown
      subtitle?: unknown
      primaryCta?: LocalizedCtaShape
      secondaryCta?: LocalizedCtaShape
      secondaryIcon?: unknown
    }
    const title = resolveLocalizedString(c.title as never, locale)?.trim() || undefined
    const subtitle = resolveLocalizedString(c.subtitle as never, locale)?.trim() || undefined
    const primary = resolveLocalizedCta(c.primaryCta, locale)
    const secondary = resolveLocalizedCta(c.secondaryCta, locale)
    const secondaryIcon = typeof c.secondaryIcon === 'string' ? c.secondaryIcon.trim() || undefined : undefined
    if (title || subtitle || primary || secondary) {
      callout = {
        ...(title ? { title } : {}),
        ...(subtitle ? { subtitle } : {}),
        ...(primary ? { primary } : {}),
        ...(secondary
          ? { secondary: { ...secondary, ...(secondaryIcon ? { icon: secondaryIcon } : {}) } }
          : {}),
      }
    }
  }

  return itemsResolved.length > 0
    ? {
        title: resolveLocalizedString(section.title as never, locale) || undefined,
        subtitle: resolveLocalizedString(section.subtitle as never, locale) || undefined,
        items: itemsResolved,
        imageMode,
        ...(callout ? { callout } : {}),
      }
    : null
}

