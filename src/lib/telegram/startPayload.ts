/**
 * The `start` parameter of the public bot's deep link,
 * `https://t.me/<bot>?start=<payload>`.
 *
 * Telegram allows 1–64 characters from `[A-Za-z0-9_-]` and hands the value
 * back as `/start <payload>` when the visitor presses Start. It carries the
 * site language and what the visitor was looking at, so the bot can greet them
 * in their language and the team sees which listing the chat is about:
 *
 *   p_<locale>_<slug>      a listing, by its key (`slug.current`)
 *   i_<locale>_<idKey>     a listing whose key is too long, by its Sanity id
 *                          without the `property-` prefix
 *   g_<locale>_<placement> anywhere else (footer, contacts page, landing…)
 *
 * Pure: shared by the buttons (browser and server) and the webhook.
 */

export const START_PAYLOAD_MAX = 64

const ALLOWED = /^[A-Za-z0-9_-]+$/
const LOCALE = /^[a-z]{2}$/
const PROPERTY_ID_PREFIX = 'property-'

export type StartPayload =
  | { kind: 'property'; locale: string; slug: string }
  | { kind: 'propertyId'; locale: string; idKey: string }
  | { kind: 'general'; locale: string; placement: string }

function safeLocale(locale: string): string {
  const l = locale.trim().toLowerCase()
  return LOCALE.test(l) ? l : 'en'
}

/** The id key: the Sanity id without `property-`, cut to what fits. */
export function propertyIdKey(id: string, room: number): string {
  const bare = id.replace(/^drafts\./, '').replace(new RegExp(`^${PROPERTY_ID_PREFIX}`), '')
  return bare.replace(/[^A-Za-z0-9_-]/g, '').slice(0, Math.max(0, room))
}

/** The Sanity ids an id key may stand for, longest guess first. */
export function propertyIdCandidates(idKey: string): string[] {
  return [`${PROPERTY_ID_PREFIX}${idKey}`, idKey]
}

export function buildPropertyStartPayload(input: { locale: string; slug: string; id?: string }): string | null {
  const locale = safeLocale(input.locale)
  const slug = input.slug.trim()
  const bySlug = `p_${locale}_${slug}`
  if (slug && bySlug.length <= START_PAYLOAD_MAX && ALLOWED.test(slug)) return bySlug
  if (!input.id) return null
  const prefix = `i_${locale}_`
  const key = propertyIdKey(input.id, START_PAYLOAD_MAX - prefix.length)
  return key ? `${prefix}${key}` : null
}

export function buildGeneralStartPayload(input: { locale: string; placement: string }): string {
  const locale = safeLocale(input.locale)
  const placement = input.placement.replace(/[^A-Za-z0-9-]/g, '').slice(0, START_PAYLOAD_MAX - 5) || 'page'
  return `g_${locale}_${placement}`
}

/** `null` for anything the site did not build (a hand-typed `/start hello`). */
export function parseStartPayload(raw: string | null | undefined): StartPayload | null {
  const v = (raw ?? '').trim()
  if (!v || v.length > START_PAYLOAD_MAX || !ALLOWED.test(v)) return null
  const m = /^([pig])_([a-z]{2})_(.+)$/.exec(v)
  if (!m) return null
  const [, kind, locale, rest] = m
  if (kind === 'p') return { kind: 'property', locale, slug: rest }
  if (kind === 'i') return { kind: 'propertyId', locale, idKey: rest }
  return { kind: 'general', locale, placement: rest }
}
