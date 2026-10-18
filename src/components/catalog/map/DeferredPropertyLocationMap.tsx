'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { PropertyLocationMapProps } from './PropertyLocationMap'

/**
 * The location map, mounted only once the visitor is within a screen of it.
 *
 * `PropertyLocationMap` imports maplibre-gl at module scope, and the listing
 * page imported it directly — so a megabyte of mapping library (266 KB over the
 * wire) was downloaded and evaluated on every property page before anything
 * above the fold had settled, for a map that sits below the description, the
 * amenities and the agent card. Nobody had scrolled to it yet.
 *
 * The placeholder carries the same height as the map, so the arrival costs no
 * layout shift, and without an IntersectionObserver the map simply loads the
 * way it used to.
 */
const PropertyLocationMap = dynamic(
  () => import('./PropertyLocationMap').then((m) => m.PropertyLocationMap),
  { ssr: false }
)

export function DeferredPropertyLocationMap(props: PropertyLocationMapProps) {
  const [slot, setSlot] = React.useState<HTMLDivElement | null>(null)
  const [withinReach, setWithinReach] = React.useState(false)

  React.useEffect(() => {
    if (withinReach || !slot) return
    if (typeof IntersectionObserver === 'undefined') {
      setWithinReach(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setWithinReach(true)
          observer.disconnect()
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(slot)
    return () => observer.disconnect()
  }, [withinReach, slot])

  return (
    <div ref={setSlot}>
      {withinReach ? (
        <PropertyLocationMap {...props} />
      ) : (
        <div
          className={cn(
            'w-full rounded-2xl border border-dark/10 dark:border-white/20 bg-dark/5 dark:bg-white/10 animate-pulse',
            props.mapHeightClassName
          )}
          aria-hidden
        />
      )}
    </div>
  )
}
