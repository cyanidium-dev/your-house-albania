/**
 * The Durrës buying guide as a lead magnet: which locales it exists in, where
 * the static PDF lives, which pages offer it, and how a download request is
 * validated and turned into a `lead`. Pure — the API route and the components
 * import from here, and the build script uses the same file names.
 */

import type { LeadContext } from '@/lib/leads/context'
import type { LeadInput } from '@/lib/leads/buildLeadDocument'

export const GUIDE_LOCALES = ['en', 'sq', 'uk', 'ru', 'it', 'pl', 'de'] as const
export type GuideLocale = (typeof GUIDE_LOCALES)[number]

export const GUIDE_ID = 'durres-buying-guide' as const

/**
 * The date of the price index the PDFs were built from (`scripts/data/durres-guide/price-index.json`
 * `asOf`). The card quotes it, and the build script refuses a JSON with another date so the
 * site never promises fresher numbers than the file holds. Bump both when regenerating.
 */
export const GUIDE_PRICE_INDEX_AS_OF = '2026-09-20'

export function isGuideLocale(v: unknown): v is GuideLocale {
  return typeof v === 'string' && (GUIDE_LOCALES as readonly string[]).includes(v)
}

/** `durres-buying-guide.de.pdf` — the file `scripts/buildDurresGuidePdf.ts` writes. */
export function guidePdfFileName(locale: GuideLocale): string {
  return `${GUIDE_ID}.${locale}.pdf`
}

/** Same-origin path of the static PDF for a locale. */
export function guidePdfPath(locale: GuideLocale): string {
  return `/guides/${guidePdfFileName(locale)}`
}

/** The guide is about Durrës and its coast; only those pages offer it. */
export function offersDurresGuide(citySlug: string | null | undefined): boolean {
  return (citySlug ?? '').trim().toLowerCase() === 'durres'
}

const MAX_EMAIL = 254
const MAX_SLUG = 200
const SLUG_REGEX = /^[a-z0-9-]+$/
// Same shape the other form routes accept; RFC-exact validation buys nothing here.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type GuideRequest = {
  locale: GuideLocale
  email: string
  /** Listing the visitor was reading when they asked, if any. */
  propertySlug?: string
  /** Validated elsewhere (`parseLeadContext`); passed through untouched. */
  context?: unknown
}

export type ParsedGuideRequest = { ok: true; value: GuideRequest } | { ok: false; error: string }

/**
 * Checks a raw request body: honeypot empty, consent ticked, a plausible
 * email, a known locale, and an optional listing slug in the catalogue's
 * slug alphabet. Anything else is a 400, never a guess.
 */
export function parseGuideRequest(input: unknown): ParsedGuideRequest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Invalid body' }
  const body = input as Record<string, unknown>

  const honeypot = typeof body.companyWebsite === 'string' ? body.companyWebsite.trim() : ''
  if (honeypot.length > 0) return { ok: false, error: 'Bad request' }

  if (body.consent !== true) return { ok: false, error: 'Consent required' }

  if (!isGuideLocale(body.locale)) return { ok: false, error: 'Invalid locale' }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email) return { ok: false, error: 'Missing email' }
  if (email.length > MAX_EMAIL || !EMAIL_REGEX.test(email)) return { ok: false, error: 'Invalid email' }

  let propertySlug: string | undefined
  if (body.propertySlug !== undefined && body.propertySlug !== null && body.propertySlug !== '') {
    if (typeof body.propertySlug !== 'string') return { ok: false, error: 'Invalid property' }
    const slug = body.propertySlug.trim()
    if (slug.length > MAX_SLUG || !SLUG_REGEX.test(slug)) return { ok: false, error: 'Invalid property' }
    propertySlug = slug
  }

  return {
    ok: true,
    value: {
      locale: body.locale,
      email,
      ...(propertySlug ? { propertySlug } : {}),
      ...(body.context !== undefined ? { context: body.context } : {}),
    },
  }
}

/** The `createLead` input for an accepted guide request. */
export function guideLeadInput(
  request: GuideRequest,
  extra: { context?: LeadContext; country?: string; now: Date },
): Omit<LeadInput, 'property' | 'agent'> & { propertySlug?: string } {
  return {
    type: 'guide_download',
    placement: 'guide',
    locale: request.locale,
    ...(extra.context ? { context: extra.context } : {}),
    ...(extra.country ? { country: extra.country } : {}),
    ...(request.propertySlug ? { propertySlug: request.propertySlug } : {}),
    contact: { email: request.email },
    formLabel: GUIDE_ID,
    now: extra.now,
  }
}
