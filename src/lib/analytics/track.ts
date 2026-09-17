/**
 * Typed `dataLayer` pushes for GTM, mirrored to Microsoft Clarity.
 *
 * The site already loads GTM (and GA4 through it) behind
 * `NEXT_PUBLIC_ENABLE_ANALYTICS` and the consent banner, so behavioural
 * analytics needs events, not another vendor. Everything here is a plain
 * dataLayer push; GTM's consent mode decides what actually leaves the browser.
 * The same call raises a Clarity custom event, so a recording can be filtered
 * by "clicked WhatsApp" instead of Clarity's own "Submit form", which also
 * fires on every catalog filter.
 *
 * Nothing a visitor typed is sent. An assistant query is a free-text field that
 * routinely contains a budget, a district and sometimes a phone number, and
 * GA4 is the wrong place for any of it — the events carry shape (length, result
 * counts) rather than content. What people actually asked belongs in the
 * server-side counters, where it stays on your own infrastructure. Lead events
 * follow the same rule: listing, placement and traffic source, never a name,
 * phone, email or message.
 */

import { syncInternalFlag } from './attribution'
import { analyticsEnabled } from './config'
import type { LeadPlacement, LeadType } from '@/lib/leads/types'

export type { LeadPlacement, LeadType }

/** GA4 parameters shared by every lead event. All optional; none identify a person. */
export type LeadEventParams = {
  lead_type?: LeadType
  placement?: LeadPlacement
  property_id?: string
  property_slug?: string
  city?: string
  district?: string
  price_eur?: number
  property_type?: string
  landing_page?: string
  source?: string
  medium?: string
  campaign?: string
  channel?: string
}

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
  /**
   * The sources behind an answer were expanded. Worth measuring on its own:
   * how often people check the provenance is the evidence for whether citing
   * figures is buying any trust.
   */
  | { event: 'ai_sources_open'; count: number }
  /** A source link under an answer was followed out to the original document. */
  | { event: 'ai_source_click'; dataId: string }
  /** A citation was followed into the knowledge base page it lives on. */
  | { event: 'ai_knowledge_click'; dataId: string }
  /**
   * A contact form was submitted successfully. Kept for existing GTM triggers;
   * `generate_lead` is the one to build on.
   */
  | { event: 'lead_submit'; kind: string; source?: string }
  /** Any successful lead form submission (not clicks). The GA4 key event. */
  | ({ event: 'generate_lead' } & LeadEventParams)
  /** General contact form or a callback (phone-only) form was sent. */
  | ({ event: 'contact_form_submit' } & LeadEventParams)
  /** The contact form about a specific listing was sent. */
  | ({ event: 'property_inquiry_submit' } & LeadEventParams)
  /** A WhatsApp / phone / email link was clicked (the app opens outside the site). */
  | ({ event: 'click_whatsapp' | 'click_phone' | 'click_email' } & LeadEventParams)
  /** An explicit search from a search widget (hero). */
  | {
      event: 'search_submit'
      placement: 'hero'
      city?: string
      property_type?: string
      deal?: string
    }
  /** Catalog filters were applied. */
  | {
      event: 'filter_apply'
      placement: 'catalog' | 'catalog-deal-tab'
      city?: string
      district?: string
      property_type?: string
      deal?: string
      has_price?: boolean
      has_area?: boolean
      beds?: string
      amenities_count?: number
    }

/**
 * GTM keeps every key ever pushed in its data model, so a `property_slug` from
 * one lead would otherwise ride along on the next event that has none. Lead
 * events reset the keys they do not set.
 */
const LEAD_PARAM_KEYS: (keyof LeadEventParams)[] = [
  'lead_type',
  'placement',
  'property_id',
  'property_slug',
  'city',
  'district',
  'price_eur',
  'property_type',
  'landing_page',
  'source',
  'medium',
  'campaign',
  'channel',
]

const LEAD_EVENTS = new Set([
  'generate_lead',
  'contact_form_submit',
  'property_inquiry_submit',
  'click_whatsapp',
  'click_phone',
  'click_email',
])

let trafficTypePushed = false

/**
 * Pushes `traffic_type: 'internal'` once per page load, before any event, and
 * tags the Clarity session. GA4's internal-traffic data filter keys off this
 * parameter; Clarity filters on the `internal` custom tag.
 */
export function markInternalTraffic(): void {
  if (!analyticsEnabled || typeof window === 'undefined') return
  if (trafficTypePushed || !syncInternalFlag()) return
  trafficTypePushed = true
  try {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ traffic_type: 'internal' })
    window.clarity?.('set', 'internal', '1')
  } catch {
    // Analytics must never break a page.
  }
}

/** Clarity tags worth filtering recordings by. Values are short, never personal. */
const CLARITY_TAG_KEYS = ['lead_type', 'placement', 'channel', 'source'] as const

function mirrorToClarity(payload: AnalyticsEvent): void {
  const clarity = window.clarity
  if (typeof clarity !== 'function') return
  // Page views are already in Clarity as page views; mirroring them adds noise.
  if (payload.event === 'property_view' || payload.event === 'blog_view') return
  clarity('event', payload.event)
  const record = payload as Record<string, unknown>
  for (const key of CLARITY_TAG_KEYS) {
    const v = record[key]
    if (typeof v === 'string' && v) clarity('set', key, v.slice(0, 100))
  }
}

/**
 * Pushes one event to GTM and Clarity. Safe to call anywhere: no-ops on the
 * server and whenever analytics is switched off, so callers never need to guard.
 */
export function track(payload: AnalyticsEvent): void {
  if (!analyticsEnabled) return
  if (typeof window === 'undefined') return
  try {
    markInternalTraffic()
    window.dataLayer = window.dataLayer ?? []
    let out: Record<string, unknown> = { ...payload }
    if (LEAD_EVENTS.has(payload.event)) {
      const reset: Record<string, undefined> = {}
      for (const key of LEAD_PARAM_KEYS) reset[key] = undefined
      out = { ...reset, ...out }
    }
    if (trafficTypePushed) out.traffic_type = 'internal'
    window.dataLayer.push(out)
  } catch {
    // Analytics must never break a page.
  }
  try {
    mirrorToClarity(payload)
  } catch {
    // Same.
  }
}
