'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The price-and-contact bar pinned to the bottom of a listing on phones.
 *
 * A fixed element takes no space in the document, so at the end of the page it
 * sat on top of the last eighty-odd pixels of the footer. Rather than padding
 * the footer — which knows nothing about this bar and would then carry dead
 * space on every other page — the bar reserves its own room by padding the
 * document while it is on screen.
 *
 * The reservation follows the bar's measured height rather than a breakpoint or
 * a hard-coded number. Above `lg` the bar is `display: none`, so its height is
 * zero and the padding disappears on its own; a wrapped label or a longer price
 * widens the bar and the padding grows with it. Watching the element and the
 * window covers both ways the height can change.
 *
 * It is the site's one floating contact surface on phones (the QuickContact
 * bubble is not mounted). The cookie banner sits above it (`z-[90]`) until it
 * is answered, and the bar goes invisible — keeping its box, so nothing moves —
 * while a contact dialog is open (`useContactModalFlag`).
 */

/** Tailwind needs the class names spelled out; the pixel value feeds matchMedia. */
const BREAKPOINT = {
  md: { hidden: 'md:hidden', minWidth: 768 },
  lg: { hidden: 'lg:hidden', minWidth: 1024 },
} as const

type Props = {
  children: ReactNode
  /** First breakpoint at which the bar disappears. The listing page keeps its CTA in the page only from `lg`. */
  hideFrom?: keyof typeof BREAKPOINT
  /** `data-lead-placement` for the contact links inside. */
  placement?: string
  /** `data-property-slug` for the contact links inside. */
  propertySlug?: string
  /** Accessible name of the bar. */
  label?: string
}

export default function MobileStickyBar({ children, hideFrom = 'lg', placement, propertySlug, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { hidden, minWidth } = BREAKPOINT[hideFrom]

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const measure = () => {
      const height = el.offsetHeight
      document.body.style.paddingBottom = height > 0 ? `${height}px` : ''
    }

    /**
     * Measured twice on purpose. `resize` fires before layout reflects the new
     * breakpoint — a phone rotating is exactly that discrete jump — so the
     * first read on the next frame can still see the old height; the delayed
     * read catches up once layout settles. Being a fraction of a second late is
     * invisible, whereas missing the change leaves the footer covered.
     */
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame)
      if (timer) clearTimeout(timer)
      frame = requestAnimationFrame(() => {
        frame = 0
        measure()
        timer = setTimeout(measure, 200)
      })
    }

    measure()

    // The observer stops reporting once the bar goes `display: none` above the
    // breakpoint — that is what the spec says about elements that are not
    // rendered — so the media query carries the transition the other way.
    const observer = new ResizeObserver(schedule)
    observer.observe(el)
    const desktop = window.matchMedia(`(min-width: ${minWidth}px)`)
    desktop.addEventListener('change', schedule)
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      if (timer) clearTimeout(timer)
      observer.disconnect()
      desktop.removeEventListener('change', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
      document.body.style.paddingBottom = ''
    }
  }, [minWidth])

  return (
    <div
      ref={ref}
      {...(label ? { role: 'region', 'aria-label': label } : {})}
      {...(placement ? { 'data-lead-placement': placement } : {})}
      {...(propertySlug ? { 'data-property-slug': propertySlug } : {})}
      className={`${hidden} fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark border-t border-dark/10 dark:border-white/20 print:hidden [[data-contact-modal]_&]:invisible`}
    >
      {children}
    </div>
  )
}
