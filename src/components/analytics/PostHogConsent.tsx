'use client'

import { useEffect } from 'react'
import { useConsent } from '@/lib/cookie-consent'
import { setPostHogConsent } from '@/lib/analytics/posthog'

/**
 * Hands the visitor's analytics choice to the PostHog loader: on a grant it
 * starts (deferred like GTM), on a withdrawal it opts out. Renders nothing.
 */
export function PostHogConsent() {
  const { isGranted } = useConsent()
  const analytics = isGranted('analytics')

  useEffect(() => {
    setPostHogConsent(analytics)
  }, [analytics])

  return null
}
