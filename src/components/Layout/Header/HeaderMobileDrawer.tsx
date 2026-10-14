'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { cn } from '@/lib/utils'

type HeaderMobileDrawerProps = {
  id: string
  open: boolean
  onClose: () => void
  /** Names the dialog (the "Menu" heading inside it). */
  labelledBy: string
  /** Gets the focus back when the drawer closes: the burger. */
  returnFocusRef: RefObject<HTMLElement | null>
  children: React.ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * The menu below `lg`, as a modal dialog (QA 2026-10-11).
 *
 * Closed, it is `inert` and `invisible` — it used to slide off-screen and
 * stay in the tab order, sixteen tab stops nobody could see on every page.
 * Open, it traps the focus, closes on Escape and on the backdrop, locks the
 * page scroll behind it and, on close, hands the focus back to the burger.
 *
 * A full-screen sheet on a phone; from `sm` a 420px panel from the right over
 * a dimmed page, as on Rightmove, Daft and Otodom.
 */
export default function HeaderMobileDrawer({
  id,
  open,
  onClose,
  labelledBy,
  returnFocusRef,
  children,
}: HeaderMobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)

  // Focus in on open, back to the burger on close.
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      const panel = panelRef.current
      // Next frame: the panel has just become visible and focusable.
      const raf = window.requestAnimationFrame(() => {
        const target = panel?.querySelector<HTMLElement>('[data-drawer-initial-focus]') ?? panel
        target?.focus({ preventScroll: true })
      })
      return () => window.cancelAnimationFrame(raf)
    }
    if (wasOpen.current) {
      wasOpen.current = false
      const active = document.activeElement
      // After a link navigated, the focus is wherever the new page put it.
      // Only pull it back when it was left in the drawer (or dropped).
      if (!active || active === document.body || panelRef.current?.contains(active)) {
        returnFocusRef.current?.focus({ preventScroll: true })
      }
    }
  }, [open, returnFocusRef])

  // Escape and the focus trap.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      )
      if (items.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panel || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Scroll lock, keeping the scrollbar's width so the page does not shift.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const body = document.body
    const scrollbar = window.innerWidth - root.clientWidth
    const prev = { root: root.style.overflow, body: body.style.overflow, padding: body.style.paddingRight }
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    return () => {
      root.style.overflow = prev.root
      body.style.overflow = prev.body
      body.style.paddingRight = prev.padding
    }
  }, [open])

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-dark/40 transition-opacity duration-300 ease-out dark:bg-black/60',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        inert={!open}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden outline-none',
          'bg-white text-dark dark:bg-[#121a1c] dark:text-white',
          'sm:max-w-[420px] sm:rounded-l-3xl sm:shadow-[0_0_60px_-12px_rgba(0,0,0,0.35)]',
          'duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
          // Visible at once on open (so the focus can move in), hidden only
          // after the slide-out on close.
          open ? 'visible translate-x-0 transition-transform' : 'invisible translate-x-full transition-[transform,visibility]',
        )}
      >
        {children}
      </div>
    </>
  )
}
