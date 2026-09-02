'use client'

import { useEffect, useRef } from 'react'
import { track, type AnalyticsEvent } from '@/lib/analytics/track'
import type { ViewKind } from '@/lib/metrics/viewCounter'

type Props = {
  kind: ViewKind
  slug: string
  /** GA4 dimensions for this page. The beacon carries only kind and slug. */
  event: AnalyticsEvent
}

/**
 * Counts one page view: a GTM event for behaviour, and a beacon to the server
 * counter for a number that survives ad blockers.
 *
 * Renders nothing, and is mounted from a server page so the page itself stays a
 * server component.
 */
export default function TrackPageView({ kind, slug, event }: Props) {
  const sent = useRef(false)

  useEffect(() => {
    // React runs effects twice in development; the page is one view either way.
    if (sent.current) return
    sent.current = true

    const storageKey = `viewed:${kind}:${slug}`
    let alreadyThisSession = false
    try {
      alreadyThisSession = window.sessionStorage.getItem(storageKey) === '1'
      window.sessionStorage.setItem(storageKey, '1')
    } catch {
      // Private mode or blocked storage: fall through and let the server
      // deduplicate instead.
    }
    if (alreadyThisSession) return

    track(event)

    // `keepalive` so the request survives the visitor clicking straight through.
    void fetch('/api/metrics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, slug }),
      keepalive: true,
    }).catch(() => {
      // Counting is best effort; never surface this.
    })
  }, [kind, slug, event])

  return null
}
