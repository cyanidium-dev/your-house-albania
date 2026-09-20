/**
 * Lead events on the client: one call per successful form or contact click,
 * fanning out to the GA4/Clarity events and, for clicks, to our own lead API.
 */

import { getLeadContext, getSessionTouch } from './attribution'
import { track, type LeadEventParams } from './track'
import type { LeadContext } from '@/lib/leads/context'
import type { ClickLeadType, LeadPlacement, LeadType } from '@/lib/leads/types'

/** The listing a lead is about, when there is one. */
export type LeadSubject = {
  propertySlug?: string
  propertyId?: string
  city?: string
  district?: string
  propertyType?: string
  priceEur?: number
}

function subjectParams(subject: LeadSubject | undefined): LeadEventParams {
  if (!subject) return {}
  const out: LeadEventParams = {}
  if (subject.propertySlug) out.property_slug = subject.propertySlug
  if (subject.propertyId) out.property_id = subject.propertyId
  if (subject.city) out.city = subject.city
  if (subject.district) out.district = subject.district
  if (subject.propertyType) out.property_type = subject.propertyType
  if (typeof subject.priceEur === 'number' && Number.isFinite(subject.priceEur)) out.price_eur = subject.priceEur
  return out
}

/** Session source as event parameters. Coarse on purpose: no journey, no referrer URL. */
function attributionParams(): LeadEventParams {
  const touch = getSessionTouch()
  if (!touch) return {}
  const out: LeadEventParams = {
    landing_page: touch.landingPage,
    source: touch.source,
    medium: touch.medium,
    channel: touch.channel,
  }
  if (touch.campaign) out.campaign = touch.campaign
  return out
}

/** Context for a lead request body; `undefined` keeps the key out of the JSON. */
export function leadContextForRequest(): LeadContext | undefined {
  return getLeadContext() ?? undefined
}

type FormLeadType = Exclude<LeadType, ClickLeadType>

/**
 * A lead form was accepted by the server. Fires `generate_lead`, the specific
 * form event, and the legacy `lead_submit` existing GTM triggers listen for.
 */
export function trackFormLead(opts: {
  leadType: FormLeadType
  placement: LeadPlacement
  subject?: LeadSubject
  /** The `lead_submit` payload this form sent before. */
  legacy: { kind: string; source?: string }
}): void {
  const params: LeadEventParams = {
    lead_type: opts.leadType,
    placement: opts.placement,
    ...subjectParams(opts.subject),
    ...attributionParams(),
  }
  track({ event: 'lead_submit', ...opts.legacy })
  track({ event: 'generate_lead', ...params })
  if (opts.leadType === 'property_inquiry' || opts.leadType === 'agent_contact') {
    track({ event: 'property_inquiry_submit', ...params })
  } else if (opts.leadType === 'contact_form') {
    track({ event: 'contact_form_submit', ...params })
  }
}

export type ClickLeadPayload = {
  type: ClickLeadType
  placement: LeadPlacement
  propertySlug?: string
  locale?: string
  context?: LeadContext
}

/**
 * Sends a click lead to `/api/leads/click` in a way that survives the page
 * being left: `sendBeacon` first, `fetch` with `keepalive` as the fallback.
 */
function sendClickLead(payload: ClickLeadPayload): void {
  const body = JSON.stringify(payload)
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // `text/plain` is CORS-safelisted; some browsers refuse a JSON-typed beacon
      // body. The route parses the raw text either way.
      const queued = navigator.sendBeacon('/api/leads/click', new Blob([body], { type: 'text/plain;charset=UTF-8' }))
      if (queued) return
    }
  } catch {
    // Try fetch below.
  }
  try {
    void fetch('/api/leads/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Best effort.
    })
  } catch {
    // Never block the click.
  }
}

/** A WhatsApp/Telegram/phone/email link was clicked: analytics event plus the server lead. */
export function trackContactClick(opts: {
  type: ClickLeadType
  placement: LeadPlacement
  subject?: LeadSubject
  locale?: string
}): void {
  track({
    event: opts.type,
    lead_type: opts.type,
    placement: opts.placement,
    ...subjectParams(opts.subject),
    ...attributionParams(),
  })
  const context = leadContextForRequest()
  sendClickLead({
    type: opts.type,
    placement: opts.placement,
    ...(opts.subject?.propertySlug ? { propertySlug: opts.subject.propertySlug } : {}),
    ...(opts.locale ? { locale: opts.locale } : {}),
    ...(context ? { context } : {}),
  })
}
