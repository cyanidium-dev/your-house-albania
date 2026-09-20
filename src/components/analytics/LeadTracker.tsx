'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  localeFromPath,
  propertySlugFromPath,
  recordPageView,
  syncInternalFlag,
  updatePageTitle,
} from '@/lib/analytics/attribution'
import { trackContactClick } from '@/lib/analytics/leadEvents'
import { markInternalTraffic } from '@/lib/analytics/track'
import { classifyContactHref, isLeadPlacement, type LeadPlacement } from '@/lib/leads/types'

/** A double tap or a click that also fires `auxclick` is one lead. */
const CLICK_DEDUPE_MS = 2000

/**
 * Records the visitor journey and turns clicks on WhatsApp, Telegram, phone and email
 * links into leads. Mounted once in the locale layout; renders nothing.
 *
 * Contact links need no wiring of their own: one capture-phase listener on the
 * document sees every click before the browser leaves for the app. Context
 * comes from `data-lead-placement` and `data-property-slug` on the link or any
 * ancestor, and falls back to the listing in the URL on a property page.
 */
export function LeadTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    syncInternalFlag()
    markInternalTraffic()
    recordPageView(pathname, document.title)
    // The App Router swaps `<title>` just after the route changes.
    const timer = window.setTimeout(() => updatePageTitle(pathname, document.title), 800)
    return () => window.clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    let lastKey = ''
    let lastAt = 0

    const onClick = (event: MouseEvent) => {
      try {
        if (event.type === 'auxclick' && event.button !== 1) return
        const target = event.target
        if (!(target instanceof Element)) return
        const anchor = target.closest('a[href]')
        if (!anchor) return
        // Contacts that are not Domlivo's (the site developer's credit line).
        if (anchor.closest('[data-lead-ignore]')) return
        const type = classifyContactHref(anchor.getAttribute('href') ?? '')
        if (!type) return

        const path = window.location.pathname
        const placementAttr = anchor.closest('[data-lead-placement]')?.getAttribute('data-lead-placement')
        const propertySlug =
          anchor.closest('[data-property-slug]')?.getAttribute('data-property-slug') ||
          propertySlugFromPath(path)
        const placement: LeadPlacement = isLeadPlacement(placementAttr)
          ? placementAttr
          : propertySlugFromPath(path)
            ? 'property'
            : 'page'

        const key = `${type}:${placement}:${propertySlug ?? ''}`
        const now = Date.now()
        if (key === lastKey && now - lastAt < CLICK_DEDUPE_MS) return
        lastKey = key
        lastAt = now

        trackContactClick({
          type,
          placement,
          ...(propertySlug ? { subject: { propertySlug } } : {}),
          locale: localeFromPath(path),
        })
      } catch {
        // Never stand between a visitor and the link they clicked.
      }
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('auxclick', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('auxclick', onClick, true)
    }
  }, [])

  return null
}
