/**
 * PostHog (EU cloud) for funnels and feature-flag experiments, behind the
 * same analytics consent as GA4 and Clarity.
 *
 * Nothing loads and nothing is stored until the visitor grants "analytics":
 * no cookie, no localStorage key, no request to PostHog. `PostHogConsent`
 * (mounted in the locale layout) reports the choice here. On a grant the
 * library is imported and started after the visitor's first move or 5 s
 * after load, the same deferral as GTM and Clarity, so it costs nothing in
 * the first paint. Events tracked while it loads are queued and sent once it
 * is up; events from before the grant are dropped, not replayed. Withdrawing
 * consent opts the browser out at once.
 *
 * PostHog gets what GA4 gets (see `track.ts`): page views, listing views and
 * lead events with placement and session source, never a name, phone, email
 * or message. Autocapture and session recording stay off for the same
 * reason; Clarity already records sessions.
 */

import type { PostHog } from 'posthog-js'
import { getSessionTouch, localeFromPath, syncInternalFlag } from './attribution'
import { analyticsEnabled } from './config'

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

/** Off unless analytics is on and the project key is set (Vercel env). */
export const posthogEnabled = analyticsEnabled && POSTHOG_KEY !== ''

/** Kept small: a burst of events while the library loads, not a backlog. */
const MAX_QUEUE = 50

let granted = false
let client: PostHog | null = null
let loading = false
let flagsLoaded = false
let queue: Array<[string, Record<string, unknown>]> = []
const flagListeners = new Set<() => void>()

/** Adds what every event should carry: the locale and how this visit arrived. */
function enrich(properties: Record<string, unknown>): Record<string, unknown> {
  const out = { ...properties }
  if (out.locale === undefined) {
    const locale = localeFromPath(window.location.pathname)
    if (locale) out.locale = locale
  }
  if (out.channel === undefined) {
    const touch = getSessionTouch()
    if (touch) {
      out.landing_page = touch.landingPage
      out.source = touch.source
      out.medium = touch.medium
      out.channel = touch.channel
      if (touch.campaign) out.campaign = touch.campaign
    }
  }
  return out
}

function start(): void {
  if (loading || client) return
  loading = true
  void import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        ui_host: 'https://eu.posthog.com',
        // App Router navigations are history changes; this covers them all.
        capture_pageview: 'history_change',
        capture_pageleave: true,
        autocapture: false,
        disable_session_recording: true,
        disable_surveys: true,
        // Anonymous events only; nobody is identified on this site.
        person_profiles: 'identified_only',
        before_send: (event) => {
          if (event?.properties) event.properties = enrich(event.properties)
          return event
        },
        loaded: (ph) => {
          if (syncInternalFlag()) ph.register({ traffic_type: 'internal' })
          ph.onFeatureFlags(() => {
            flagsLoaded = true
            for (const listener of flagListeners) listener()
          })
        },
      })
      if (!granted) {
        posthog.opt_out_capturing()
      } else if (posthog.has_opted_out_capturing()) {
        posthog.opt_in_capturing()
      }
      client = posthog
      const pending = queue
      queue = []
      if (granted) for (const [name, properties] of pending) posthog.capture(name, properties)
    })
    .catch(() => {
      // Blocked by an extension or offline: the site works without it.
    })
    .finally(() => {
      loading = false
    })
}

/** Waits for the first pointer, scroll or key, or 5 s after load, like GTM. */
function startWhenIdle(): void {
  const events = ['pointerdown', 'pointermove', 'wheel', 'scroll', 'keydown', 'touchstart'] as const
  let done = false
  const go = () => {
    if (done) return
    done = true
    for (const e of events) window.removeEventListener(e, go)
    start()
  }
  for (const e of events) window.addEventListener(e, go, { passive: true, once: true })
  const arm = () => window.setTimeout(go, 5000)
  if (document.readyState === 'complete') arm()
  else window.addEventListener('load', arm, { once: true })
}

/** Called by `PostHogConsent` on load and on every change of the analytics choice. */
export function setPostHogConsent(analyticsGranted: boolean): void {
  if (!posthogEnabled || typeof window === 'undefined') return
  granted = analyticsGranted
  if (!granted) {
    queue = []
    try {
      client?.opt_out_capturing()
    } catch {
      // Never break the page.
    }
    return
  }
  if (client) {
    try {
      if (client.has_opted_out_capturing()) client.opt_in_capturing()
    } catch {
      // Same.
    }
    return
  }
  startWhenIdle()
}

/** Sends one event, queues it while the library loads, or drops it without consent. */
export function capturePostHog(name: string, properties: Record<string, unknown>): void {
  if (!posthogEnabled || !granted || typeof window === 'undefined') return
  try {
    if (client) client.capture(name, properties)
    else if (queue.length < MAX_QUEUE) queue.push([name, properties])
  } catch {
    // Analytics must never break a page.
  }
}

/**
 * The visitor's variant of a multivariate flag, or `undefined` when PostHog
 * is off, not consented, still loading or the flag is unknown. Reading it
 * records the exposure (`$feature_flag_called`) PostHog experiments count.
 */
export function getFlagVariant(key: string): string | undefined {
  if (!client || !granted || !flagsLoaded) return undefined
  try {
    const value = client.getFeatureFlag(key)
    return typeof value === 'string' ? value : undefined
  } catch {
    return undefined
  }
}

/** Runs `listener` whenever flags arrive or reload. Returns the unsubscribe. */
export function onFlagsChange(listener: () => void): () => void {
  flagListeners.add(listener)
  return () => {
    flagListeners.delete(listener)
  }
}
