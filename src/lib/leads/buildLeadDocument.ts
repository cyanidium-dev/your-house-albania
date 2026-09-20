/**
 * Builds the Sanity `lead` document from a validated lead. Pure: the API routes
 * validate, this shapes, `createLead` writes.
 *
 * Contact fields (name, phone, email, message) are only ever set for form
 * leads — a click carries no personal data. The IP address is never stored;
 * the country comes from the edge's geo header.
 */

import type { DeviceClass, LeadContext, TouchPoint } from './context'
import { isClickLeadType, type LeadPlacement, type LeadStatus, type LeadType } from './types'

type WeakReference = { _type: 'reference'; _ref: string; _weak: true }

type LeadTouchFields = {
  source: string
  medium: string
  channel: string
  campaign?: string
  landingPage: string
  referrerHost?: string
  at: string
}

export type LeadDocument = {
  _type: 'lead'
  type: LeadType
  status: LeadStatus
  internal: boolean
  createdAt: string
  placement?: LeadPlacement
  locale?: string
  property?: WeakReference
  propertySlug?: string
  propertyTitle?: string
  agent?: WeakReference
  agentSlug?: string
  source?: string
  medium?: string
  channel?: string
  campaign?: string
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string }
  hasGclid?: boolean
  referrerHost?: string
  landingPage?: string
  firstTouch?: LeadTouchFields
  currentPage?: string
  pagesViewed?: { _key: string; _type: 'pageVisit'; path: string; title?: string }[]
  pagesViewedCount?: number
  propertySlugsViewed?: string[]
  timeOnSiteSec?: number
  country?: string
  device?: DeviceClass
  browserLanguage?: string
  name?: string
  phone?: string
  email?: string
  message?: string
  interest?: {
    location?: string
    propertyType?: string
    dealType?: string
    budget?: string
    area?: string
  }
  formLabel?: string
}

export type LeadInput = {
  type: LeadType
  placement?: LeadPlacement
  locale?: string
  context?: LeadContext
  /** ISO 3166 alpha-2 from `x-vercel-ip-country`. */
  country?: string
  property?: { id?: string; slug: string; title?: string }
  agent?: { id?: string; slug?: string }
  /** Form leads only. */
  contact?: { name?: string; phone?: string; email?: string; message?: string }
  interest?: LeadDocument['interest']
  /** Free placement label a form already sends (quote widgets). */
  formLabel?: string
  now: Date
}

function weakRef(id: string): WeakReference {
  // Published id: a reference to a draft id would dangle once it is published.
  return { _type: 'reference', _ref: id.replace(/^drafts\./, ''), _weak: true }
}

function touchFields(t: TouchPoint): LeadTouchFields {
  return {
    source: t.source,
    medium: t.medium,
    channel: t.channel,
    ...(t.campaign ? { campaign: t.campaign } : {}),
    landingPage: t.landingPage,
    ...(t.referrerHost ? { referrerHost: t.referrerHost } : {}),
    at: t.at,
  }
}

/** Drops `undefined` and empty strings so the document stays tidy in Studio. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === '') continue
    out[k] = v
  }
  return out as T
}

export function isClickLead(type: LeadType): boolean {
  return isClickLeadType(type)
}

export function buildLeadDocument(input: LeadInput): LeadDocument {
  const ctx = input.context
  const internal = ctx?.internal === true
  const session = ctx?.session

  const doc: LeadDocument = {
    _type: 'lead',
    type: input.type,
    // Test traffic is kept for debugging but never pollutes the pipeline.
    status: internal ? 'spam' : 'new',
    internal,
    createdAt: input.now.toISOString(),
  }

  const utm = session
    ? compact({
        source: session.utmSource,
        medium: session.utmMedium,
        campaign: session.utmCampaign,
        content: session.utmContent,
        term: session.utmTerm,
      })
    : undefined

  const contact = !isClickLead(input.type) && input.contact ? compact(input.contact) : undefined
  const interest = !isClickLead(input.type) && input.interest ? compact(input.interest) : undefined

  return compact({
    ...doc,
    placement: input.placement,
    locale: input.locale || ctx?.locale || undefined,
    property: input.property?.id ? weakRef(input.property.id) : undefined,
    propertySlug: input.property?.slug,
    propertyTitle: input.property?.title,
    agent: input.agent?.id ? weakRef(input.agent.id) : undefined,
    agentSlug: input.agent?.slug,
    source: session?.source,
    medium: session?.medium,
    channel: session?.channel,
    campaign: session?.campaign,
    utm: utm && Object.keys(utm).length > 0 ? utm : undefined,
    hasGclid: session ? session.hasGclid : undefined,
    referrerHost: session?.referrerHost,
    landingPage: session?.landingPage,
    firstTouch: ctx?.firstTouch ? touchFields(ctx.firstTouch) : undefined,
    currentPage: ctx?.currentPage,
    pagesViewed: ctx?.pagesViewed.length
      ? ctx.pagesViewed.map((p, i) => ({
          _key: `p${i}`,
          _type: 'pageVisit' as const,
          path: p.path,
          ...(p.title ? { title: p.title } : {}),
        }))
      : undefined,
    pagesViewedCount: ctx ? ctx.pagesViewedCount : undefined,
    propertySlugsViewed: ctx?.propertySlugsViewed.length ? ctx.propertySlugsViewed : undefined,
    timeOnSiteSec: ctx ? ctx.timeOnSiteSec : undefined,
    country: input.country,
    device: ctx?.device,
    browserLanguage: ctx?.language,
    ...(contact ?? {}),
    interest: interest && Object.keys(interest).length > 0 ? interest : undefined,
    formLabel: input.formLabel,
  })
}

/** `x-vercel-ip-country`, if it is a plausible country code. The IP itself is never read. */
export function countryFromHeaders(headers: Headers): string | undefined {
  const v = headers.get('x-vercel-ip-country')?.trim().toUpperCase()
  return v && /^[A-Z]{2}$/.test(v) ? v : undefined
}
