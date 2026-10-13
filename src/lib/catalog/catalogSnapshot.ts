import type { PropertyHomes } from '@/types/propertyHomes'

/**
 * The appended pages of a listing, kept for the way back.
 *
 * "Show more" and the automatic pages append cards in the browser; opening a
 * card and pressing Back used to return the visitor to the server's first 24
 * at the top of the page. The listing keeps what it appended and the scroll
 * position in sessionStorage under a key of its own history entry (written
 * into `history.state`), so Back restores exactly that visit and a new visit
 * to the same URL starts from the top.
 *
 * Best effort throughout: blocked storage, a full quota or a stale entry
 * mean the page simply renders as the server sent it.
 */

export type CatalogSnapshot = {
  url: string
  items: PropertyHomes[]
  nextPage: number
  hasMore: boolean
  autoLoads: number
  scrollY: number
  savedAt: number
}

const STORAGE_PREFIX = 'domlivo:catalog-snapshot:'
const STATE_KEY = 'domlivoCatalogEntry'
/** Older than this, the listing may have changed under it; start fresh. */
const MAX_AGE_MS = 30 * 60 * 1000
/** Only the most recent entries are kept, so storage never fills up. */
const MAX_SNAPSHOTS = 5

/**
 * This history entry's key, created on the first visit and carried in
 * `history.state` (Next keeps foreign keys there across its own updates).
 */
export function catalogEntryKey(): string {
  const existing = window.history.state?.[STATE_KEY]
  if (typeof existing === 'string' && existing) return existing
  const key = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  try {
    window.history.replaceState({ ...window.history.state, [STATE_KEY]: key }, '')
  } catch {
    // A sandboxed frame may refuse; the snapshot is then simply never found.
  }
  return key
}

export function readCatalogSnapshot(key: string, url: string): CatalogSnapshot | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    const snapshot = JSON.parse(raw) as CatalogSnapshot
    if (snapshot.url !== url) return null
    if (Date.now() - snapshot.savedAt > MAX_AGE_MS) return null
    if (!Array.isArray(snapshot.items)) return null
    return snapshot
  } catch {
    return null
  }
}

export function writeCatalogSnapshot(key: string, data: Omit<CatalogSnapshot, 'savedAt'>): void {
  try {
    const storage = window.sessionStorage
    storage.setItem(STORAGE_PREFIX + key, JSON.stringify({ ...data, savedAt: Date.now() }))
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (k?.startsWith(STORAGE_PREFIX)) keys.push(k)
    }
    if (keys.length <= MAX_SNAPSHOTS) return
    const byAge = keys
      .map((k) => {
        try {
          return { k, at: (JSON.parse(storage.getItem(k) ?? '{}') as CatalogSnapshot).savedAt ?? 0 }
        } catch {
          return { k, at: 0 }
        }
      })
      .sort((a, b) => a.at - b.at)
    for (const { k } of byAge.slice(0, byAge.length - MAX_SNAPSHOTS)) storage.removeItem(k)
  } catch {
    // Quota or blocked storage: Back shows the first page, as before.
  }
}
