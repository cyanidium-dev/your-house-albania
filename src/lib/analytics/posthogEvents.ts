/**
 * How a `track()` payload becomes a PostHog event. Pure, so the mapping is
 * tested without a browser.
 *
 * GA4 gets three events per form lead (`lead_submit`, `generate_lead` and the
 * form-specific one) because GTM triggers grew around each. PostHog gets one,
 * named after the lead type, so a funnel step reads the way the team talks:
 * `property_inquiry`, `contact_form`, `guide_download`, `click_whatsapp`.
 * Every lead also carries `is_lead: true`, which makes "any lead" a single
 * funnel step.
 */

import type { AnalyticsEvent } from './track'

export type PostHogEvent = { name: string; properties: Record<string, unknown> }

/** GA4-only duplicates of `generate_lead`. */
const SKIPPED = new Set(['lead_submit', 'contact_form_submit', 'property_inquiry_submit'])

const CLICK_LEADS = new Set(['click_whatsapp', 'click_telegram', 'click_phone', 'click_email'])

export function toPostHogEvent(payload: AnalyticsEvent): PostHogEvent | null {
  if (SKIPPED.has(payload.event)) return null
  const { event, ...rest } = payload as { event: string } & Record<string, unknown>
  const properties: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) properties[key] = value
  }
  if (event === 'generate_lead') {
    const leadType = typeof properties.lead_type === 'string' ? properties.lead_type : 'generate_lead'
    return { name: leadType, properties: { ...properties, is_lead: true } }
  }
  if (CLICK_LEADS.has(event)) return { name: event, properties: { ...properties, is_lead: true } }
  return { name: event, properties }
}
