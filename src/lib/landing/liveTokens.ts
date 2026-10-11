/**
 * Live figures inside CMS copy. A landing's hero line and meta description say
 * how many listings it has and from what price ("612 offers from €39,000");
 * typed by hand those numbers go stale within a week. Editors write
 * `{count}`, `{fromPrice}` or `{medianPricePerSqm}` instead, and the page fills
 * them from the same catalogue filter as its inventory band or feed.
 *
 * Which filter: the first `inventorySummarySection`, else the first auto
 * `propertyCarouselSection` — the block the numbers describe.
 */

import { formatMoney } from '@/lib/currency/format'
import type { InventorySummary } from '@/lib/catalog/inventorySummary'
import {
  normalizeLandingListingFilter,
  resolveLandingListingScope,
  type LandingListingScope,
} from '@/lib/landing/listingFilter'

export const LIVE_TOKENS = ['count', 'fromPrice', 'medianPricePerSqm'] as const
export type LiveToken = (typeof LIVE_TOKENS)[number]
export type LiveTokenValues = Partial<Record<LiveToken, string>>

const TOKEN_RE = /\{(count|fromPrice|medianPricePerSqm)\}/g

export function hasLiveTokens(text: unknown): boolean {
  return typeof text === 'string' && new RegExp(TOKEN_RE.source).test(text)
}

/**
 * Replace the tokens. A token without a value (no listings matched) is
 * dropped rather than printed as `{count}`, and the doubled space it leaves
 * is closed.
 */
export function fillLiveTokens(text: string, values: LiveTokenValues | null | undefined): string {
  if (!hasLiveTokens(text)) return text
  return text
    .replace(TOKEN_RE, (_, key: LiveToken) => values?.[key] ?? '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/** The figures as text in the page locale (EUR: copy is not currency-switched). */
export function liveTokenValues(summary: InventorySummary | null, locale: string): LiveTokenValues | null {
  if (!summary || summary.count === 0) return null
  const out: LiveTokenValues = { count: new Intl.NumberFormat(locale).format(summary.count) }
  if (summary.fromPrice) out.fromPrice = formatMoney(summary.fromPrice, 'EUR', locale)
  if (summary.medianPricePerSqm) out.medianPricePerSqm = `${formatMoney(summary.medianPricePerSqm, 'EUR', locale)}/m²`
  return out
}

type SectionLike = { _type?: string; enabled?: boolean; mode?: string; filters?: unknown }

/** The catalogue scope the live figures describe, or `null` when the page has no such block. */
export function liveTokenScope(
  sections: readonly SectionLike[],
  ctx: Parameters<typeof resolveLandingListingScope>[1] = {},
): LandingListingScope | null {
  const live = sections.filter((s) => s && s.enabled !== false)
  const source =
    live.find((s) => s._type === 'inventorySummarySection') ??
    live.find((s) => s._type === 'propertyCarouselSection' && s.mode !== 'selected')
  if (!source) return null
  return resolveLandingListingScope(normalizeLandingListingFilter(source.filters), ctx) ?? {}
}

/** Does any of these localized CMS values, in this locale, carry a token? */
export function localizedHasLiveTokens(fields: unknown[], locale: string): boolean {
  return fields.some((f) => {
    if (typeof f === 'string') return hasLiveTokens(f)
    if (f && typeof f === 'object') {
      const rec = f as Record<string, unknown>
      return hasLiveTokens(rec[locale]) || hasLiveTokens(rec.en)
    }
    return false
  })
}

const SEO_TEXT_FIELDS = ['metaTitle', 'metaDescription', 'ogTitle', 'ogDescription'] as const

/** The landing's SEO text fields that may carry tokens, as found on `seo`. */
export function seoLiveTokenFields(seo: unknown): unknown[] {
  if (!seo || typeof seo !== 'object') return []
  return SEO_TEXT_FIELDS.map((k) => (seo as Record<string, unknown>)[k])
}

/**
 * A copy of `seo` with the tokens in its title and description fields filled
 * for `locale` (and the English fallback the resolver may reach for).
 */
export function fillSeoLiveTokens<T>(seo: T, locale: string, values: LiveTokenValues | null): T {
  if (!seo || typeof seo !== 'object') return seo
  const out: Record<string, unknown> = { ...(seo as Record<string, unknown>) }
  for (const key of SEO_TEXT_FIELDS) {
    const field = out[key]
    if (!field || typeof field !== 'object') continue
    const copy: Record<string, unknown> = { ...(field as Record<string, unknown>) }
    for (const l of new Set([locale, 'en'])) {
      if (typeof copy[l] === 'string') copy[l] = fillLiveTokens(copy[l] as string, values)
    }
    out[key] = copy
  }
  return out as T
}
