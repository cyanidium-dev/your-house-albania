/**
 * The visitor journey attached to a lead: where they came from and what they
 * looked at before getting in touch.
 *
 * Shared by both sides. The browser builds a `LeadContext` from its own storage
 * (`@/lib/analytics/attribution`) and sends it only with the visitor's own
 * action — a form submit or a click on a contact link. The server never trusts
 * that object: `parseLeadContext` rebuilds it field by field, drops anything of
 * the wrong shape and caps every string, so a hand-crafted body can neither
 * break the lead nor flood Telegram.
 */

export const TRAFFIC_CHANNELS = [
  'direct',
  'organic_search',
  'paid_search',
  'ai',
  'social',
  'email',
  'referral',
  'campaign',
] as const

export type TrafficChannel = (typeof TRAFFIC_CHANNELS)[number]

export const DEVICE_CLASSES = ['mobile', 'tablet', 'desktop'] as const

export type DeviceClass = (typeof DEVICE_CLASSES)[number]

/** One attribution snapshot: the first visit ever, or the current session. */
export type TouchPoint = {
  source: string
  medium: string
  channel: TrafficChannel
  campaign?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  /** Presence only — the click id itself is never kept. */
  hasGclid: boolean
  referrerHost?: string
  /** Path only, no query string. */
  landingPage: string
  /** ISO timestamp. */
  at: string
}

export type PageVisit = { path: string; title: string }

export type LeadContext = {
  firstTouch: TouchPoint | null
  session: TouchPoint
  /** Most recent last, capped at {@link MAX_PAGES}. */
  pagesViewed: PageVisit[]
  /** Every page view this session, including ones dropped from the list. */
  pagesViewedCount: number
  propertySlugsViewed: string[]
  timeOnSiteSec: number
  currentPage: string
  device: DeviceClass
  /** `navigator.language`. */
  language: string
  /** Site locale from the URL. */
  locale: string
  /** Set by `?domlivo_internal=1` — the owner testing, not a visitor. */
  internal: boolean
}

export const MAX_PAGES = 20
const MAX_SLUGS = 20
const MAX_SHORT = 120
const MAX_PATH = 300
const MAX_TITLE = 200

type Rec = Record<string, unknown>

function isRecord(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Replaces each run of control characters (newlines, NUL, DEL…) with one space. */
function stripControlChars(v: string): string {
  let out = ''
  let inRun = false
  for (const ch of v) {
    const code = ch.charCodeAt(0)
    if (code < 32 || code === 127) {
      if (!inRun) out += ' '
      inRun = true
    } else {
      out += ch
      inRun = false
    }
  }
  return out
}

/** Trims, strips control characters and caps; `undefined` for anything empty. */
export function cleanText(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = stripControlChars(v).trim()
  if (!s) return undefined
  return s.length > max ? s.slice(0, max) : s
}

/** A same-site path. Absolute URLs and protocol-relative paths are refused. */
export function cleanPath(v: unknown): string | undefined {
  const s = cleanText(v, MAX_PATH)
  if (!s || !s.startsWith('/') || s.startsWith('//')) return undefined
  return s
}

const SLUG_PATTERN = /^[a-z0-9-]{1,160}$/

export function cleanSlug(v: unknown): string | undefined {
  return typeof v === 'string' && SLUG_PATTERN.test(v) ? v : undefined
}

function cleanIso(v: unknown): string | undefined {
  if (typeof v !== 'string' || v.length > 40) return undefined
  const t = Date.parse(v)
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined
}

function cleanInt(v: unknown, max: number): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return undefined
  return Math.min(Math.round(v), max)
}

function oneOf<T extends string>(values: readonly T[], v: unknown): T | undefined {
  return typeof v === 'string' && (values as readonly string[]).includes(v) ? (v as T) : undefined
}

export function parseTouchPoint(v: unknown): TouchPoint | null {
  if (!isRecord(v)) return null
  const source = cleanText(v.source, MAX_SHORT)
  const medium = cleanText(v.medium, MAX_SHORT)
  const channel = oneOf(TRAFFIC_CHANNELS, v.channel)
  const landingPage = cleanPath(v.landingPage)
  const at = cleanIso(v.at)
  if (!source || !medium || !channel || !landingPage || !at) return null

  const out: TouchPoint = {
    source,
    medium,
    channel,
    hasGclid: v.hasGclid === true,
    landingPage,
    at,
  }
  const optional = {
    campaign: cleanText(v.campaign, MAX_SHORT),
    utmSource: cleanText(v.utmSource, MAX_SHORT),
    utmMedium: cleanText(v.utmMedium, MAX_SHORT),
    utmCampaign: cleanText(v.utmCampaign, MAX_SHORT),
    utmContent: cleanText(v.utmContent, MAX_SHORT),
    utmTerm: cleanText(v.utmTerm, MAX_SHORT),
    referrerHost: cleanText(v.referrerHost, MAX_SHORT),
  }
  for (const [k, val] of Object.entries(optional) as [keyof typeof optional, string | undefined][]) {
    if (val !== undefined) out[k] = val
  }
  return out
}

/**
 * Rebuilds a context received from the browser. Returns `undefined` when the
 * core (the session touch point) is missing; every other field degrades to an
 * empty value instead of failing the lead.
 */
export function parseLeadContext(input: unknown): LeadContext | undefined {
  if (!isRecord(input)) return undefined
  const session = parseTouchPoint(input.session)
  if (!session) return undefined

  const pagesViewed: PageVisit[] = []
  if (Array.isArray(input.pagesViewed)) {
    for (const p of input.pagesViewed.slice(-MAX_PAGES)) {
      if (!isRecord(p)) continue
      const path = cleanPath(p.path)
      if (!path) continue
      pagesViewed.push({ path, title: cleanText(p.title, MAX_TITLE) ?? '' })
    }
  }

  const propertySlugsViewed: string[] = []
  if (Array.isArray(input.propertySlugsViewed)) {
    for (const s of input.propertySlugsViewed.slice(-MAX_SLUGS)) {
      const slug = cleanSlug(s)
      if (slug && !propertySlugsViewed.includes(slug)) propertySlugsViewed.push(slug)
    }
  }

  return {
    firstTouch: parseTouchPoint(input.firstTouch),
    session,
    pagesViewed,
    pagesViewedCount: Math.max(cleanInt(input.pagesViewedCount, 100_000) ?? 0, pagesViewed.length),
    propertySlugsViewed,
    // A week is already far past any real session; the cap keeps junk readable.
    timeOnSiteSec: cleanInt(input.timeOnSiteSec, 7 * 24 * 3600) ?? 0,
    currentPage: cleanPath(input.currentPage) ?? session.landingPage,
    device: oneOf(DEVICE_CLASSES, input.device) ?? 'desktop',
    language: cleanText(input.language, 35) ?? '',
    locale: cleanText(input.locale, 10) ?? '',
    internal: input.internal === true,
  }
}
