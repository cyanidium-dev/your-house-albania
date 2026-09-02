/**
 * Typed `dataLayer` pushes for GTM.
 *
 * The site already loads GTM (and GA4 through it) behind
 * `NEXT_PUBLIC_ENABLE_ANALYTICS` and the consent banner, so behavioural
 * analytics needs events, not another vendor. Everything here is a plain
 * dataLayer push; GTM's consent mode decides what actually leaves the browser.
 *
 * Nothing a visitor typed is sent. An assistant query is a free-text field that
 * routinely contains a budget, a district and sometimes a phone number, and
 * GA4 is the wrong place for any of it — the events carry shape (length, result
 * counts) rather than content. What people actually asked belongs in the
 * server-side counters, where it stays on your own infrastructure.
 */

import { analyticsEnabled } from './config'

export type AnalyticsEvent =
  /** A listing detail page was opened. */
  | {
      event: 'property_view'
      slug: string
      city?: string
      district?: string
      propertyType?: string
      priceEur?: number
    }
  /** A blog article was opened. */
  | { event: 'blog_view'; slug: string; category?: string }
  /** The assistant page was opened, and from where. */
  | { event: 'ai_search_open'; entry: 'hero' | 'header' | 'direct' }
  /** A question was sent. `queryLength` stands in for the text itself. */
  | { event: 'ai_search_query'; queryLength: number; turn: number }
  /** An answer came back, with how many listings it showed. */
  | { event: 'ai_search_result'; cards: number; hadResults: boolean }
  /** A listing card inside the assistant was clicked. */
  | { event: 'ai_card_click'; slug: string }
  /** The "see all in the catalog" button under an answer was clicked. */
  | { event: 'ai_catalog_click' }
  /** A contact form was submitted successfully. */
  | { event: 'lead_submit'; kind: string; source?: string }

/**
 * Pushes one event. Safe to call anywhere: no-ops on the server and whenever
 * analytics is switched off, so callers never need to guard.
 */
export function track(payload: AnalyticsEvent): void {
  if (!analyticsEnabled) return
  if (typeof window === 'undefined') return
  try {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push(payload)
  } catch {
    // Analytics must never break a page.
  }
}
