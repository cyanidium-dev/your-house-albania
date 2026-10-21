'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
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
import type { MessengerSheetRequest } from '@/components/contact/MessengerSheet'

/** Loaded on the first messenger click (and warmed on the pointer going down). */
const loadSheet = () => import('@/components/contact/MessengerSheet')
const MessengerSheet = dynamic(loadSheet, { ssr: false })

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
 *
 * A plain click on WhatsApp or Telegram opens the messenger sheet instead of
 * leaving at once (one more tap opens the chat, or the visitor leaves a
 * number). The click still counts as the `click_whatsapp` / `click_telegram`
 * intent; links inside the sheet carry `data-lead-ignore`, so the second tap
 * is not counted again. Modifier clicks, middle clicks and links marked
 * `data-messenger-direct` go straight to the app as before.
 */
export function LeadTracker() {
  const pathname = usePathname()
  const [sheet, setSheet] = useState<MessengerSheetRequest | null>(null)
  const closeSheet = useCallback(() => setSheet(null), [])

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
        const repeat = key === lastKey && now - lastAt < CLICK_DEDUPE_MS
        lastKey = key
        lastAt = now

        const locale = localeFromPath(path)
        // A repeat is not a second lead, but it still opens the sheet below.
        if (!repeat) {
          trackContactClick({
            type,
            placement,
            ...(propertySlug ? { subject: { propertySlug } } : {}),
            locale,
          })
        }

        if (
          (type === 'click_whatsapp' || type === 'click_telegram') &&
          event.type === 'click' &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          !anchor.closest('[data-messenger-direct]')
        ) {
          event.preventDefault()
          setSheet({
            id: now,
            key: type === 'click_whatsapp' ? 'whatsapp' : 'telegram',
            href: anchor.getAttribute('href') ?? '',
            locale: locale || 'en',
            placement,
            propertySlug: propertySlug ?? null,
            plain: anchor.closest('[data-messenger-plain]') !== null,
            agent: anchor.closest('[data-messenger-agent]') !== null,
          })
        }
      } catch {
        // Never stand between a visitor and the link they clicked.
      }
    }

    let warmed = false
    const onPointerDown = (event: PointerEvent) => {
      if (warmed || !(event.target instanceof Element)) return
      const href = event.target.closest('a[href]')?.getAttribute('href') ?? ''
      const type = classifyContactHref(href)
      if (type !== 'click_whatsapp' && type !== 'click_telegram') return
      warmed = true
      void loadSheet().catch(() => {
        warmed = false
      })
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('auxclick', onClick, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('auxclick', onClick, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])

  return sheet ? <MessengerSheet key={sheet.id} request={sheet} onClose={closeSheet} /> : null
}
