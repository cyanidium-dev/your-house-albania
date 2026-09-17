/**
 * Strict body schema for `POST /api/leads/click`. Unknown keys are refused, so
 * the endpoint cannot be used to smuggle anything else into a lead or a chat.
 */

import { cleanSlug, parseLeadContext, type LeadContext } from './context'
import { isClickLeadType, isLeadPlacement, type ClickLeadType, type LeadPlacement } from './types'

export const SITE_LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const

export type ClickLeadBody = {
  type: ClickLeadType
  placement: LeadPlacement
  propertySlug?: string
  locale?: string
  context?: LeadContext
}

const ALLOWED_KEYS = new Set(['type', 'placement', 'propertySlug', 'locale', 'context'])

/** Larger than any real context (20 pages × a few hundred bytes), small enough to refuse junk. */
export const MAX_CLICK_BODY_BYTES = 32_000

export function parseClickLeadBody(
  input: unknown
): { ok: true; value: ClickLeadBody } | { ok: false; error: string } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, error: 'Invalid body' }
  }
  const body = input as Record<string, unknown>
  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) return { ok: false, error: `Unexpected field: ${key.slice(0, 40)}` }
  }
  if (!isClickLeadType(body.type)) return { ok: false, error: 'Invalid type' }
  if (body.placement !== undefined && !isLeadPlacement(body.placement)) {
    return { ok: false, error: 'Invalid placement' }
  }

  let propertySlug: string | undefined
  if (body.propertySlug !== undefined) {
    propertySlug = cleanSlug(body.propertySlug)
    if (!propertySlug) return { ok: false, error: 'Invalid property' }
  }

  let locale: string | undefined
  if (body.locale !== undefined && body.locale !== '') {
    if (typeof body.locale !== 'string' || !(SITE_LOCALES as readonly string[]).includes(body.locale)) {
      return { ok: false, error: 'Invalid locale' }
    }
    locale = body.locale
  }

  let context: LeadContext | undefined
  if (body.context !== undefined) {
    context = parseLeadContext(body.context)
    if (!context) return { ok: false, error: 'Invalid context' }
  }

  return {
    ok: true,
    value: {
      type: body.type,
      placement: isLeadPlacement(body.placement) ? body.placement : 'page',
      ...(propertySlug ? { propertySlug } : {}),
      ...(locale ? { locale } : {}),
      ...(context ? { context } : {}),
    },
  }
}

/** Absolute listing URL for a message; falls back to English for an unknown locale. */
export function propertyUrl(baseUrl: string, locale: string | undefined, slug: string): string {
  const l = locale && (SITE_LOCALES as readonly string[]).includes(locale) ? locale : 'en'
  return `${baseUrl.replace(/\/$/, '')}/${l}/property/${slug}`
}
