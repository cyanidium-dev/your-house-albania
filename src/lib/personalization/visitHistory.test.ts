import { beforeEach, describe, expect, it } from 'vitest'
import { dismissWelcomeBack, recordListingView, touchVisit, VISIT_GAP_MS } from './visitHistory'

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size
    },
  }
}
;(globalThis as { window?: unknown }).window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() }

const T0 = Date.parse('2026-10-20T10:00:00Z')

describe('visit history', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('a first visit is not a return', () => {
    expect(touchVisit(T0)).toEqual({ earlierViews: [], dismissed: false })
  })

  it('a visit after a long gap returns with the earlier views', () => {
    touchVisit(T0)
    recordListingView('flat-a', T0 + 1000)
    recordListingView('flat-b', T0 + 2000)
    recordListingView('flat-a', T0 + 3000)
    window.sessionStorage.clear() // a new tab, the next day
    const next = touchVisit(T0 + 3000 + VISIT_GAP_MS + 1)
    expect(next.previousVisitAt).toBe(T0 + 3000)
    expect(next.earlierViews).toEqual(['flat-b', 'flat-a'])
  })

  it('stays the same answer for the whole session', () => {
    touchVisit(T0)
    recordListingView('flat-a', T0 + 1000)
    window.sessionStorage.clear()
    const later = T0 + 1000 + VISIT_GAP_MS + 1
    expect(touchVisit(later).previousVisitAt).toBe(T0 + 1000)
    expect(touchVisit(later + 5000).previousVisitAt).toBe(T0 + 1000)
  })

  it('a short break in the same tab is the same visit', () => {
    touchVisit(T0)
    recordListingView('flat-a', T0 + 1000)
    window.sessionStorage.clear()
    expect(touchVisit(T0 + 60_000).previousVisitAt).toBeUndefined()
  })

  it('remembers "not now" for a week', () => {
    dismissWelcomeBack(T0)
    window.sessionStorage.clear()
    expect(touchVisit(T0 + 1000).dismissed).toBe(true)
    window.sessionStorage.clear()
    expect(touchVisit(T0 + 8 * 24 * 3600 * 1000).dismissed).toBe(false)
  })
})
