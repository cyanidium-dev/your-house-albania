/**
 * First-party visit attribution and journey, kept in the visitor's own browser.
 *
 * - First touch (localStorage, 30 days): how the visitor first arrived.
 * - Session (sessionStorage): how this visit arrived, when it started, the
 *   pages seen in order and the listings opened.
 *
 * Nothing here is sent anywhere on its own. `getLeadContext()` is read only
 * when the visitor acts — submits a form or clicks a contact link — and goes to
 * our own API with that request. GA4 and Clarity get a handful of coarse event
 * parameters (source, medium, campaign, landing page), never the journey.
 *
 * Every storage access is wrapped: private windows and blocked site data fall
 * back to memory for the life of the page, and nothing here ever throws.
 */

import {
  MAX_PAGES,
  cleanSlug,
  type LeadContext,
  type PageVisit,
  type TouchPoint,
} from '@/lib/leads/context'
import { classifyDevice, classifyTraffic, normalizeHost } from './trafficSource'

const FIRST_TOUCH_KEY = 'domlivo:first-touch'
const SESSION_KEY = 'domlivo:session'
const LAST_SESSION_KEY = 'domlivo:last-session'
const INTERNAL_KEY = 'domlivo:internal'

const FIRST_TOUCH_TTL_MS = 30 * 24 * 3600 * 1000
/** A tab opened from the site within this window continues the same visit. */
const SESSION_CONTINUE_MS = 30 * 60 * 1000
const MAX_SLUGS = 20

type StoredFirstTouch = { touch: TouchPoint; expiresAt: number }

type StoredSession = {
  touch: TouchPoint
  startedAt: number
  pages: PageVisit[]
  pagesCount: number
  slugs: string[]
  updatedAt: number
}

type StorageKind = 'local' | 'session'

/** Used when storage is unavailable, so a single page load still has a journey. */
const memory = new Map<string, string>()

function storage(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function readRaw(kind: StorageKind, key: string): string | null {
  try {
    const s = storage(kind)
    if (s) return s.getItem(key)
  } catch {
    // Fall through to memory.
  }
  return memory.get(`${kind}:${key}`) ?? null
}

function writeRaw(kind: StorageKind, key: string, value: string | null): void {
  const memKey = `${kind}:${key}`
  if (value === null) memory.delete(memKey)
  else memory.set(memKey, value)
  try {
    const s = storage(kind)
    if (!s) return
    if (value === null) s.removeItem(key)
    else s.setItem(key, value)
  } catch {
    // Quota or blocked storage: memory already has it.
  }
}

function readJson<T>(kind: StorageKind, key: string): T | null {
  const raw = readRaw(kind, key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function cap(v: string | null | undefined, max = 120): string | undefined {
  const s = v?.trim()
  return s ? s.slice(0, max) : undefined
}

export function propertySlugFromPath(path: string): string | undefined {
  const m = /^\/[a-z]{2}\/property\/([^/?#]+)/.exec(path)
  return m ? cleanSlug(decodeURIComponent(m[1])) : undefined
}

export function localeFromPath(path: string): string {
  const m = /^\/([a-z]{2})(\/|$)/.exec(path)
  return m ? m[1] : ''
}

// ---------------------------------------------------------------------------
// Internal traffic
// ---------------------------------------------------------------------------

/**
 * Applies `?domlivo_internal=1` / `=0` from the current URL. Returns whether
 * this browser is flagged as internal.
 */
export function syncInternalFlag(): boolean {
  if (!isBrowser()) return false
  try {
    const v = new URLSearchParams(window.location.search).get('domlivo_internal')
    if (v === '1') writeRaw('local', INTERNAL_KEY, '1')
    else if (v === '0') writeRaw('local', INTERNAL_KEY, null)
  } catch {
    // Keep whatever was stored.
  }
  return readRaw('local', INTERNAL_KEY) === '1'
}

// ---------------------------------------------------------------------------
// Touch points and session
// ---------------------------------------------------------------------------

function touchFromCurrentUrl(now: number): TouchPoint {
  let params = new URLSearchParams()
  try {
    params = new URLSearchParams(window.location.search)
  } catch {
    // Keep empty params.
  }
  let referrerHost = ''
  try {
    referrerHost = document.referrer ? new URL(document.referrer).host : ''
  } catch {
    referrerHost = ''
  }

  const utmSource = cap(params.get('utm_source'))
  const utmMedium = cap(params.get('utm_medium'))
  const utmCampaign = cap(params.get('utm_campaign'))
  const utmContent = cap(params.get('utm_content'))
  const utmTerm = cap(params.get('utm_term'))
  const hasGclid = params.has('gclid')
  const traffic = classifyTraffic({
    referrerHost,
    selfHost: window.location.host,
    utmSource,
    utmMedium,
    utmCampaign,
    hasGclid,
  })

  const host = normalizeHost(referrerHost)
  const touch: TouchPoint = {
    source: traffic.source,
    medium: traffic.medium,
    channel: traffic.channel,
    hasGclid,
    landingPage: window.location.pathname.slice(0, 300) || '/',
    at: new Date(now).toISOString(),
  }
  const optional = { campaign: traffic.campaign, utmSource, utmMedium, utmCampaign, utmContent, utmTerm }
  for (const [k, v] of Object.entries(optional) as [keyof typeof optional, string | undefined][]) {
    if (v !== undefined) touch[k] = v
  }
  if (host && host !== normalizeHost(window.location.host)) touch.referrerHost = host
  return touch
}

/** New campaign parameters in the URL start a new session, as GA4 does. */
function urlHasNewCampaign(session: StoredSession): boolean {
  try {
    const params = new URLSearchParams(window.location.search)
    const utm = params.get('utm_source')
    if (utm && cap(utm) !== session.touch.utmSource) return true
    if (params.get('utm_campaign') && cap(params.get('utm_campaign')) !== session.touch.utmCampaign) return true
    if (params.has('gclid') && !session.touch.hasGclid) return true
  } catch {
    // No URL: nothing new.
  }
  return false
}

function saveSession(session: StoredSession): void {
  const json = JSON.stringify(session)
  writeRaw('session', SESSION_KEY, json)
  writeRaw('local', LAST_SESSION_KEY, json)
}

function ensureFirstTouch(touch: TouchPoint, now: number): void {
  const stored = readJson<StoredFirstTouch>('local', FIRST_TOUCH_KEY)
  if (stored?.touch && typeof stored.expiresAt === 'number' && stored.expiresAt > now) return
  writeRaw('local', FIRST_TOUCH_KEY, JSON.stringify({ touch, expiresAt: now + FIRST_TOUCH_TTL_MS }))
}

function startSession(now: number): StoredSession {
  const touch = touchFromCurrentUrl(now)

  // A new tab opened from one of our own pages (a listing middle-clicked in the
  // catalog) is the same visit: sessionStorage is per tab, so carry it over.
  if (!touch.utmSource && !touch.hasGclid) {
    let fromSelf = false
    try {
      fromSelf = !!document.referrer && new URL(document.referrer).host === window.location.host
    } catch {
      fromSelf = false
    }
    const last = readJson<StoredSession>('local', LAST_SESSION_KEY)
    if (fromSelf && last?.touch && typeof last.updatedAt === 'number' && now - last.updatedAt < SESSION_CONTINUE_MS) {
      const continued: StoredSession = { ...last, updatedAt: now }
      saveSession(continued)
      return continued
    }
  }

  const session: StoredSession = { touch, startedAt: now, pages: [], pagesCount: 0, slugs: [], updatedAt: now }
  ensureFirstTouch(touch, now)
  saveSession(session)
  return session
}

function currentSession(now: number): StoredSession {
  const stored = readJson<StoredSession>('session', SESSION_KEY)
  if (!stored?.touch || !Array.isArray(stored.pages) || urlHasNewCampaign(stored)) {
    return startSession(now)
  }
  return stored
}

/**
 * Records one page view. Called by `LeadTracker` on every pathname change; the
 * same path twice in a row (a re-render, a query-only change) counts once.
 */
export function recordPageView(path: string, title: string): void {
  if (!isBrowser()) return
  try {
    const now = Date.now()
    const session = currentSession(now)
    const last = session.pages[session.pages.length - 1]
    if (last?.path !== path) {
      session.pages = [...session.pages, { path: path.slice(0, 300), title: title.slice(0, 200) }].slice(-MAX_PAGES)
      session.pagesCount += 1
    }
    const slug = propertySlugFromPath(path)
    if (slug && !session.slugs.includes(slug)) {
      session.slugs = [...session.slugs, slug].slice(-MAX_SLUGS)
    }
    session.updatedAt = now
    saveSession(session)
  } catch {
    // Attribution is best effort.
  }
}

/**
 * The App Router sets `<title>` after the pathname changes, so the tracker
 * records the path first and fills the title in a moment later.
 */
export function updatePageTitle(path: string, title: string): void {
  if (!isBrowser() || !title) return
  try {
    const stored = readJson<StoredSession>('session', SESSION_KEY)
    const last = stored?.pages?.[stored.pages.length - 1]
    if (!stored || !last || last.path !== path || last.title === title) return
    last.title = title.slice(0, 200)
    saveSession(stored)
  } catch {
    // Best effort.
  }
}

/** Session source for event parameters; `null` before anything is recorded or on the server. */
export function getSessionTouch(): TouchPoint | null {
  if (!isBrowser()) return null
  try {
    return currentSession(Date.now()).touch
  } catch {
    return null
  }
}

/** Snapshot sent with a lead. Never throws; on the server it returns `null`. */
export function getLeadContext(): LeadContext | null {
  if (!isBrowser()) return null
  try {
    const now = Date.now()
    const session = currentSession(now)
    const stored = readJson<StoredFirstTouch>('local', FIRST_TOUCH_KEY)
    const firstTouch = stored?.touch && stored.expiresAt > now ? stored.touch : null
    const path = window.location.pathname
    let maxTouchPoints = 0
    try {
      maxTouchPoints = navigator.maxTouchPoints ?? 0
    } catch {
      maxTouchPoints = 0
    }
    return {
      firstTouch,
      session: session.touch,
      pagesViewed: session.pages,
      pagesViewedCount: Math.max(session.pagesCount, session.pages.length),
      propertySlugsViewed: session.slugs,
      timeOnSiteSec: Math.max(0, Math.round((now - session.startedAt) / 1000)),
      currentPage: path,
      device: classifyDevice(window.innerWidth, navigator.userAgent, maxTouchPoints),
      language: (navigator.language || '').slice(0, 35),
      locale: localeFromPath(path),
      internal: syncInternalFlag(),
    }
  } catch {
    return null
  }
}
