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
 */
export default function MobileStickyBar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

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
    const desktop = window.matchMedia('(min-width: 1024px)')
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
  }, [])

  return (
    <div
      ref={ref}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark border-t border-dark/10 dark:border-white/20"
    >
      {children}
    </div>
  )
}
