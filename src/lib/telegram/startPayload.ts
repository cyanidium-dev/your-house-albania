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
 *   s_<locale>_<filters>   a catalogue search to get new listings for
 *                          (`encodeSearchFilters`): the visitor subscribes
 *                          by pressing Start, `/stop` ends it
 *
 * Pure: shared by the buttons (browser and server) and the webhook.
 */

export const START_PAYLOAD_MAX = 64

const ALLOWED = /^[A-Za-z0-9_-]+$/
const LOCALE = /^[a-z]{2}$/
const PROPERTY_ID_PREFIX = 'property-'

/**
 * The part of a catalogue search a subscription keeps: what narrows the
 * stock, not how it is sorted or paged. Mirrors `CatalogFilters`.
 */
export type SearchFilters = {
  city?: string
  cities?: string[]
  district?: string
  type?: string
  types?: string[]
  deal?: string
  stage?: 'off-plan' | 'under-construction' | 'completed' | 'unfinished'
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  beds?: number
  bedsExact?: number
  nearSea?: boolean
  investment?: boolean
}

export type StartPayload =
  | { kind: 'property'; locale: string; slug: string }
  | { kind: 'propertyId'; locale: string; idKey: string }
  | { kind: 'general'; locale: string; placement: string }
  | { kind: 'search'; locale: string; filters: SearchFilters }

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

const SLUG = /^[a-z0-9-]+$/
const STAGES = ['off-plan', 'under-construction', 'completed', 'unfinished'] as const

function slugToken(key: string, value: string | undefined): string | null {
  const v = (value ?? '').trim().toLowerCase()
  return v && SLUG.test(v) ? `${key}${v}` : null
}

function rangeToken(key: string, min: number | undefined, max: number | undefined): string | null {
  const lo = min && min > 0 ? Math.round(min) : 0
  const hi = max && max > 0 ? Math.round(max) : 0
  if (!lo && !hi) return null
  return `${key}${lo || ''}-${hi || ''}`
}

function countToken(key: string, n: number | undefined): string | null {
  return n && n > 0 ? `${key}${Math.round(n)}` : null
}

/**
 * The filters as `_`-joined tokens, a capital key letter before each value:
 * `Cdurres_Lsale_Tapartment_P50000-120000_B2_N`. Slugs are lowercase, so the
 * key never mixes with the value. The most telling filters go first and a
 * token that no longer fits is left out, so the subscription may be wider
 * than the search, never narrower. `null` when there is nothing to keep.
 */
export function encodeSearchFilters(f: SearchFilters, room: number): string | null {
  const tokens: Array<string | null> = [
    slugToken('C', f.city),
    slugToken('D', f.district),
    slugToken('L', f.deal),
    slugToken('T', f.type),
    rangeToken('P', f.minPrice, f.maxPrice),
    countToken('B', f.beds),
    countToken('E', f.bedsExact),
    rangeToken('A', f.minArea, f.maxArea),
    f.stage && (STAGES as readonly string[]).includes(f.stage) ? `S${f.stage}` : null,
    f.nearSea ? 'N' : null,
    f.investment ? 'I' : null,
    ...(f.cities ?? []).map((c) => slugToken('M', c)),
    ...(f.types ?? []).map((t) => slugToken('Y', t)),
  ]
  const kept: string[] = []
  let length = 0
  for (const t of tokens) {
    if (!t) continue
    const next = length + t.length + (kept.length ? 1 : 0)
    if (next > room) continue
    kept.push(t)
    length = next
  }
  return kept.length ? kept.join('_') : null
}

function parseRange(v: string): [number | undefined, number | undefined] | null {
  const m = /^(\d{0,9})-(\d{0,9})$/.exec(v)
  if (!m || (!m[1] && !m[2])) return null
  return [m[1] ? Number(m[1]) : undefined, m[2] ? Number(m[2]) : undefined]
}

/** The filters back from their tokens; unknown or malformed tokens are skipped. */
export function decodeSearchFilters(encoded: string): SearchFilters | null {
  const f: SearchFilters = {}
  for (const token of encoded.split('_')) {
    const key = token[0]
    const v = token.slice(1)
    if (!key) continue
    if (key === 'N' && !v) f.nearSea = true
    else if (key === 'I' && !v) f.investment = true
    else if ((key === 'C' || key === 'D' || key === 'L' || key === 'T') && SLUG.test(v)) {
      if (key === 'C') f.city = v
      else if (key === 'D') f.district = v
      else if (key === 'L') f.deal = v
      else f.type = v
    } else if (key === 'M' && SLUG.test(v)) f.cities = [...(f.cities ?? []), v]
    else if (key === 'Y' && SLUG.test(v)) f.types = [...(f.types ?? []), v]
    else if (key === 'S' && (STAGES as readonly string[]).includes(v)) f.stage = v as SearchFilters['stage']
    else if ((key === 'B' || key === 'E') && /^\d{1,2}$/.test(v)) {
      if (key === 'B') f.beds = Number(v)
      else f.bedsExact = Number(v)
    } else if (key === 'P' || key === 'A') {
      const r = parseRange(v)
      if (!r) continue
      if (key === 'P') {
        if (r[0]) f.minPrice = r[0]
        if (r[1]) f.maxPrice = r[1]
      } else {
        if (r[0]) f.minArea = r[0]
        if (r[1]) f.maxArea = r[1]
      }
    }
  }
  return Object.keys(f).length ? f : null
}

/** `null` when the search has no filter worth subscribing to. */
export function buildSearchStartPayload(input: { locale: string; filters: SearchFilters }): string | null {
  const prefix = `s_${safeLocale(input.locale)}_`
  const encoded = encodeSearchFilters(input.filters, START_PAYLOAD_MAX - prefix.length)
  return encoded ? `${prefix}${encoded}` : null
}

/** `null` for anything the site did not build (a hand-typed `/start hello`). */
export function parseStartPayload(raw: string | null | undefined): StartPayload | null {
  const v = (raw ?? '').trim()
  if (!v || v.length > START_PAYLOAD_MAX || !ALLOWED.test(v)) return null
  const m = /^([pigs])_([a-z]{2})_(.+)$/.exec(v)
  if (!m) return null
  const [, kind, locale, rest] = m
  if (kind === 'p') return { kind: 'property', locale, slug: rest }
  if (kind === 'i') return { kind: 'propertyId', locale, idKey: rest }
  if (kind === 's') {
    const filters = decodeSearchFilters(rest)
    return filters ? { kind: 'search', locale, filters } : null
  }
  return { kind: 'general', locale, placement: rest }
}
