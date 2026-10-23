/**
 * What this browser remembers about its visits, for "welcome back" (E002).
 *
 * localStorage only, like the lead journey in `attribution.ts`: the listings
 * viewed (slugs and when) and when the visitor was last active. Nothing leaves
 * the browser until the page asks `/api/recommendations` for picks, and then
 * only the slugs and one date. Every access is wrapped: blocked storage means
 * no welcome back, never a broken page.
 */

const STORE_KEY = 'domlivo:visits'
const SESSION_KEY = 'domlivo:visit'
/** A gap longer than this starts a new visit. */
export const VISIT_GAP_MS = 30 * 60 * 1000
const MAX_VIEWS = 20
/** Views older than this are no longer an interest. */
const VIEW_TTL_MS = 60 * 24 * 60 * 60 * 1000
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000

type Store = {
  v: 1
  views: { slug: string; at: number }[]
  lastSeenAt: number
  dismissedUntil?: number
}

export type VisitState = {
  /** When the previous visit ended; set only on a returning visit. */
  previousVisitAt?: number
  /** Listings viewed before this visit, oldest first. */
  earlierViews: string[]
  dismissed: boolean
}

function readStore(): Store {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORE_KEY) ?? 'null') as Partial<Store> | null
    if (raw && raw.v === 1 && Array.isArray(raw.views)) {
      return {
        v: 1,
        views: raw.views.filter((x) => x && typeof x.slug === 'string' && typeof x.at === 'number'),
        lastSeenAt: typeof raw.lastSeenAt === 'number' ? raw.lastSeenAt : 0,
        ...(typeof raw.dismissedUntil === 'number' ? { dismissedUntil: raw.dismissedUntil } : {}),
      }
    }
  } catch {
    // Unreadable or blocked: start over.
  }
  return { v: 1, views: [], lastSeenAt: 0 }
}

function writeStore(store: Store): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    // Full or blocked storage: the feature simply stays off.
  }
}

/** Remembers a listing view (most recent last, one entry per listing). */
export function recordListingView(slug: string, now = Date.now()): void {
  const store = readStore()
  store.views = [...store.views.filter((v) => v.slug !== slug && now - v.at < VIEW_TTL_MS), { slug, at: now }].slice(-MAX_VIEWS)
  store.lastSeenAt = now
  writeStore(store)
}

/**
 * Marks the visitor active and says whether this is a returning visit. The
 * answer is fixed for the tab's session, so it does not flip mid-visit.
 */
export function touchVisit(now = Date.now()): VisitState {
  const store = readStore()
  let previousVisitAt: number | undefined
  try {
    const saved = window.sessionStorage.getItem(SESSION_KEY)
    if (saved !== null) {
      const n = Number(saved)
      previousVisitAt = Number.isFinite(n) && n > 0 ? n : undefined
    } else {
      previousVisitAt = store.lastSeenAt > 0 && now - store.lastSeenAt > VISIT_GAP_MS ? store.lastSeenAt : undefined
      window.sessionStorage.setItem(SESSION_KEY, String(previousVisitAt ?? 0))
    }
  } catch {
    previousVisitAt = undefined
  }
  store.lastSeenAt = now
  writeStore(store)
  return {
    ...(previousVisitAt ? { previousVisitAt } : {}),
    earlierViews: previousVisitAt
      ? store.views.filter((v) => v.at <= previousVisitAt && now - v.at < VIEW_TTL_MS).map((v) => v.slug)
      : [],
    dismissed: (store.dismissedUntil ?? 0) > now,
  }
}

/** "Not now": no welcome back for a week. */
export function dismissWelcomeBack(now = Date.now()): void {
  const store = readStore()
  store.dismissedUntil = now + DISMISS_MS
  writeStore(store)
}
