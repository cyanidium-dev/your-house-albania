/**
 * The visit beacon: one small request per page view to our own analytics
 * store (`POST /api/metrics/hit`), so visits by source and landing page are
 * counted on our side rather than only by GA4, which most visitors' consent
 * choice keeps blind.
 *
 * It carries the path and the session's source/medium/campaign that
 * `attribution.ts` already worked out — nothing that identifies the visitor,
 * no cookie, no new storage. The server adds a +1 to a daily aggregate.
 */

import type { PageViewRecord } from './attribution'

const ENDPOINT = '/api/metrics/hit'

export type HitPayload = {
  path: string
  entry: boolean
  source: string
  medium: string
  campaign: string
}

export function hitPayload(path: string, view: PageViewRecord): HitPayload {
  return {
    path,
    entry: view.entry,
    source: view.touch.source,
    medium: view.touch.medium,
    campaign: view.touch.campaign ?? '',
  }
}

/** Automation (Playwright, Lighthouse, Selenium) announces itself here. */
function isAutomated(): boolean {
  try {
    return navigator.webdriver === true
  } catch {
    return false
  }
}

/**
 * Sends the beacon for a page view `recordPageView` counted. The path is the
 * browser's own `location.pathname`, which is always percent-encoded; the
 * router's pathname can arrive decoded and would be refused by the server.
 */
export function sendHit(view: PageViewRecord | null): void {
  if (!view?.counted || typeof window === 'undefined' || isAutomated()) return
  try {
    const body = JSON.stringify(hitPayload(window.location.pathname, view))
    if (typeof navigator.sendBeacon === 'function') {
      // `text/plain` is CORS-safelisted; the route parses the raw text.
      const queued = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }))
      if (queued) return
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body,
      keepalive: true,
    }).catch(() => {
      // Counting is best effort.
    })
  } catch {
    // Never let counting break navigation.
  }
}
