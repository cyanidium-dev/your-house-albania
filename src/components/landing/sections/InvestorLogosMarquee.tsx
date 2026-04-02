'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { LogoTile, type LogoRow } from '@/components/landing/sections/investorLogosShared'

/** Pixels per second — slow, steady drift (time-based for consistent speed across refresh rates). */
const AUTO_SCROLL_PX_PER_SEC = 32
const RESUME_AFTER_DRAG_MS = 1600
/** Horizontal movement before marquee drag + pointer capture start (keeps clicks on links reliable). */
const DRAG_START_PX = 6
/** Movement that counts as an intentional drag (post-drag pause + distinguishes drag from noisy micro-moves). */
const DRAG_CANCEL_CLICK_PX = 12

const MAX_REPEATS = 24
/** Minimum repeat copies so few logos still tile wide viewports. */
const MIN_REPEATS = 6
/** Cover viewport width × this many “cycles” before we stop growing repeats. */
const VIEWPORT_COVER_FACTOR = 2.5

const WINDOW_LISTENER_OPTS = { capture: true } as const

function wrapOffset(offset: number, cycle: number): number {
  if (cycle <= 0 || !Number.isFinite(cycle)) return offset
  let o = offset % cycle
  if (o < 0) o += cycle
  return o
}

function defaultRepeatCount(n: number): number {
  const count = Math.max(1, n)
  return Math.min(MAX_REPEATS, Math.max(MIN_REPEATS, Math.ceil(18 / count)))
}

type GestureSession = {
  pointerId: number
  initialX: number
  maxDelta: number
  dragCommitted: boolean
}

export function InvestorLogosMarquee({
  locale,
  rows,
  scrollRegionLabel,
}: {
  locale: string
  rows: LogoRow[]
  scrollRegionLabel: string
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  /** Width of one cycle (one flex group = one copy of `rows`). */
  const cycleRef = React.useRef<HTMLDivElement>(null)

  const rafRef = React.useRef(0)
  const lastFrameTsRef = React.useRef<number | null>(null)

  const offsetRef = React.useRef(0)
  const cycleWidthRef = React.useRef(0)

  const [repeatCount, setRepeatCount] = React.useState(() => defaultRepeatCount(rows.length))

  /** After a real drag, hold auto-scroll until the resume timer clears this. */
  const interactionPausedRef = React.useRef(false)

  const dragRef = React.useRef({
    active: false,
    startX: 0,
    startOffset: 0,
    pointerId: -1,
  })

  /** -1 = no active press session; otherwise tracking pointer until up/cancel. */
  const sessionRef = React.useRef<GestureSession | null>(null)
  const removeWindowListenersRef = React.useRef<(() => void) | null>(null)

  const isHoveredRef = React.useRef(false)
  const prefersReducedMotionRef = React.useRef(false)

  const resumeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isGrabbing, setIsGrabbing] = React.useState(false)

  const applyTransform = React.useCallback(() => {
    const t = trackRef.current
    if (!t) return
    t.style.transform = `translate3d(-${offsetRef.current}px,0,0)`
  }, [])

  const measureCycleAndMaybeGrow = React.useCallback(() => {
    const viewport = viewportRef.current
    const cycleEl = cycleRef.current
    if (!viewport || !cycleEl) return

    const cw = cycleEl.offsetWidth
    cycleWidthRef.current = cw

    const vw = viewport.clientWidth
    if (cw > 0 && vw > 0) {
      const needed = Math.ceil((vw * VIEWPORT_COVER_FACTOR) / cw) + 1
      const next = Math.min(MAX_REPEATS, Math.max(MIN_REPEATS, needed))
      setRepeatCount((prev) => (next > prev ? next : prev))
    }

    offsetRef.current = wrapOffset(offsetRef.current, cw)
    applyTransform()
  }, [applyTransform])

  const measureRef = React.useRef(measureCycleAndMaybeGrow)
  measureRef.current = measureCycleAndMaybeGrow
  const applyRef = React.useRef(applyTransform)
  applyRef.current = applyTransform

  React.useLayoutEffect(() => {
    setRepeatCount(defaultRepeatCount(rows.length))
    offsetRef.current = 0
  }, [rows])

  React.useLayoutEffect(() => {
    measureCycleAndMaybeGrow()
    const id = requestAnimationFrame(measureCycleAndMaybeGrow)
    return () => cancelAnimationFrame(id)
  }, [rows, repeatCount, measureCycleAndMaybeGrow])

  React.useEffect(() => {
    const v = viewportRef.current
    if (!v || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measureCycleAndMaybeGrow())
    ro.observe(v)
    return () => ro.disconnect()
  }, [measureCycleAndMaybeGrow])

  /** When logo images/layout finish, the viewport box often stays the same — observe the first cycle so `cw` updates from 0. */
  React.useEffect(() => {
    const c = cycleRef.current
    if (!c || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measureCycleAndMaybeGrow())
    ro.observe(c)
    return () => ro.disconnect()
  }, [measureCycleAndMaybeGrow, repeatCount, rows])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      prefersReducedMotionRef.current = mq.matches
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const clearResumeTimer = React.useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
  }, [])

  const scheduleResumeAuto = React.useCallback(() => {
    clearResumeTimer()
    resumeTimerRef.current = setTimeout(() => {
      interactionPausedRef.current = false
      resumeTimerRef.current = null
    }, RESUME_AFTER_DRAG_MS)
  }, [clearResumeTimer])

  const detachWindowListeners = React.useCallback(() => {
    if (removeWindowListenersRef.current) {
      removeWindowListenersRef.current()
      removeWindowListenersRef.current = null
    }
  }, [])

  const endGesture = React.useCallback(
    (e: PointerEvent) => {
      const session = sessionRef.current
      if (!session || e.pointerId !== session.pointerId) return

      const viewport = viewportRef.current
      if (session.dragCommitted && viewport) {
        try {
          viewport.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }

      const wasRealDrag = session.dragCommitted && session.maxDelta >= DRAG_CANCEL_CLICK_PX

      detachWindowListeners()
      sessionRef.current = null

      dragRef.current.active = false
      dragRef.current.pointerId = -1
      setIsGrabbing(false)

      if (wasRealDrag) {
        interactionPausedRef.current = true
        scheduleResumeAuto()
      } else {
        interactionPausedRef.current = false
        clearResumeTimer()
      }
    },
    [clearResumeTimer, detachWindowListeners, scheduleResumeAuto]
  )

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const viewport = viewportRef.current
      if (!viewport) return
      if (sessionRef.current) return

      measureCycleAndMaybeGrow()
      clearResumeTimer()
      interactionPausedRef.current = false

      sessionRef.current = {
        pointerId: e.pointerId,
        initialX: e.clientX,
        maxDelta: 0,
        dragCommitted: false,
      }

      const onWinMove = (ev: PointerEvent) => {
        const session = sessionRef.current
        if (!session || ev.pointerId !== session.pointerId) return

        session.maxDelta = Math.max(session.maxDelta, Math.abs(ev.clientX - session.initialX))

        if (!session.dragCommitted && session.maxDelta >= DRAG_START_PX) {
          session.dragCommitted = true
          dragRef.current.active = true
          dragRef.current.startX = ev.clientX
          dragRef.current.startOffset = offsetRef.current
          dragRef.current.pointerId = ev.pointerId
          measureRef.current()
          try {
            viewport.setPointerCapture(ev.pointerId)
          } catch {
            /* ignore */
          }
          setIsGrabbing(true)
        }

        if (session.dragCommitted) {
          measureRef.current()
          const cycle = cycleWidthRef.current
          let next = dragRef.current.startOffset + (dragRef.current.startX - ev.clientX)
          next = wrapOffset(next, cycle)
          offsetRef.current = next
          applyRef.current()
        }
      }

      const onWinUp = (ev: PointerEvent) => {
        endGesture(ev)
      }

      window.addEventListener('pointermove', onWinMove, WINDOW_LISTENER_OPTS)
      window.addEventListener('pointerup', onWinUp, WINDOW_LISTENER_OPTS)
      window.addEventListener('pointercancel', onWinUp, WINDOW_LISTENER_OPTS)

      removeWindowListenersRef.current = () => {
        window.removeEventListener('pointermove', onWinMove, WINDOW_LISTENER_OPTS)
        window.removeEventListener('pointerup', onWinUp, WINDOW_LISTENER_OPTS)
        window.removeEventListener('pointercancel', onWinUp, WINDOW_LISTENER_OPTS)
      }
    },
    [clearResumeTimer, endGesture, measureCycleAndMaybeGrow]
  )

  React.useEffect(() => {
    const viewportSnapshot = viewportRef.current
    return () => {
      const session = sessionRef.current
      if (session?.dragCommitted && viewportSnapshot && session.pointerId >= 0) {
        try {
          viewportSnapshot.releasePointerCapture(session.pointerId)
        } catch {
          /* ignore */
        }
      }
      sessionRef.current = null
      detachWindowListeners()
      clearResumeTimer()
    }
  }, [clearResumeTimer, detachWindowListeners])

  React.useEffect(() => {
    const tick = (ts: number) => {
      const last = lastFrameTsRef.current
      lastFrameTsRef.current = ts
      const dtSec = last != null ? Math.min(32, ts - last) / 1000 : 0

      const cycle = cycleWidthRef.current
      const dragging = dragRef.current.active
      const autoOff =
        dragging ||
        interactionPausedRef.current ||
        isHoveredRef.current

      if (cycle > 0 && !autoOff && dtSec > 0) {
        offsetRef.current += AUTO_SCROLL_PX_PER_SEC * dtSec
        while (offsetRef.current >= cycle) {
          offsetRef.current -= cycle
        }
        applyTransform()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearResumeTimer()
    }
  }, [applyTransform, clearResumeTimer])

  const cycles = React.useMemo(() => {
    const out: React.ReactNode[] = []
    for (let rep = 0; rep < repeatCount; rep++) {
      out.push(
        <div
          key={`cycle-${rep}`}
          ref={rep === 0 ? cycleRef : undefined}
          className="flex shrink-0 items-center gap-8 md:gap-10"
        >
          {rows.map((row, idx) => (
            <LogoTile
              key={`${row.key}-${idx}-${rep}`}
              image={row.image}
              alt={row.alt}
              href={row.href}
              locale={locale}
            />
          ))}
        </div>
      )
    }
    return out
  }, [rows, repeatCount, locale])

  return (
    <div className="relative w-full min-w-0 overflow-hidden py-4 md:py-5">
      {/* Single shell: dark underlay + primary tint — no inner “frame” band */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black/20 dark:bg-black/25"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-primary/10" />
      <div className="relative z-10 min-w-0">
        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerEnter={() => {
            isHoveredRef.current = true
          }}
          onPointerLeave={() => {
            isHoveredRef.current = false
          }}
          className={cn(
            'min-w-0 cursor-grab touch-pan-y overflow-x-hidden overflow-y-visible select-none',
            isGrabbing && 'cursor-grabbing'
          )}
          role="region"
          aria-label={scrollRegionLabel}
        >
          <div
            ref={trackRef}
            data-marquee-track=""
            className="flex w-max min-w-0 flex-nowrap items-center will-change-transform transform-gpu"
          >
            {cycles}
          </div>
        </div>
      </div>
    </div>
  )
}
