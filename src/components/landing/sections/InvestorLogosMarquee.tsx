'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { LogoTile, type LogoRow } from '@/components/landing/sections/investorLogosShared'

/** Pixels per second — slow, steady drift (time-based for consistent speed across refresh rates). */
const AUTO_SCROLL_PX_PER_SEC = 32
const RESUME_AFTER_DRAG_MS = 1600
const DRAG_SUPPRESS_CLICK_PX = 8

const MAX_REPEATS = 24
/** Minimum repeat copies so few logos still tile wide viewports. */
const MIN_REPEATS = 6
/** Cover viewport width × this many “cycles” before we stop growing repeats. */
const VIEWPORT_COVER_FACTOR = 2.5

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
    maxDelta: 0,
  })
  const suppressNextClickRef = React.useRef(false)
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

  const onPointerDownCapture = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const el = viewportRef.current
      if (!el) return

      measureCycleAndMaybeGrow()
      clearResumeTimer()
      interactionPausedRef.current = false

      dragRef.current = {
        active: true,
        startX: e.clientX,
        startOffset: offsetRef.current,
        pointerId: e.pointerId,
        maxDelta: 0,
      }
      setIsGrabbing(true)
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    },
    [clearResumeTimer, measureCycleAndMaybeGrow]
  )

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active) return
      measureCycleAndMaybeGrow()
      const cycle = cycleWidthRef.current
      dragRef.current.maxDelta = Math.max(
        dragRef.current.maxDelta,
        Math.abs(e.clientX - dragRef.current.startX)
      )
      let next = dragRef.current.startOffset + (dragRef.current.startX - e.clientX)
      next = wrapOffset(next, cycle)
      offsetRef.current = next
      applyTransform()
    },
    [applyTransform, measureCycleAndMaybeGrow]
  )

  const endPointerDrag = React.useCallback(
    (e?: React.PointerEvent<HTMLDivElement>) => {
      const el = viewportRef.current
      const pid = e?.pointerId ?? dragRef.current.pointerId
      const wasDrag = dragRef.current.maxDelta >= DRAG_SUPPRESS_CLICK_PX

      if (dragRef.current.active && el && pid === dragRef.current.pointerId) {
        try {
          el.releasePointerCapture(pid)
        } catch {
          /* ignore */
        }
        if (wasDrag) {
          suppressNextClickRef.current = true
        }
      }

      dragRef.current.active = false
      dragRef.current.pointerId = -1
      setIsGrabbing(false)

      if (wasDrag) {
        interactionPausedRef.current = true
        scheduleResumeAuto()
      } else {
        interactionPausedRef.current = false
        clearResumeTimer()
      }
    },
    [clearResumeTimer, scheduleResumeAuto]
  )

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endPointerDrag(e)
    },
    [endPointerDrag]
  )

  const onPointerCancel = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endPointerDrag(e)
    },
    [endPointerDrag]
  )

  const onClickCapture = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressNextClickRef.current = false
    }
  }, [])

  React.useEffect(() => {
    const tick = (ts: number) => {
      const last = lastFrameTsRef.current
      lastFrameTsRef.current = ts
      const dtSec = last != null ? Math.min(32, ts - last) / 1000 : 0

      const cycle = cycleWidthRef.current
      const dragging = dragRef.current.active
      const autoOff = dragging || interactionPausedRef.current

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
          onPointerDownCapture={onPointerDownCapture}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onClickCapture={onClickCapture}
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
