'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { PropertyLocationMapProps } from './PropertyLocationMap'

type MapComponent = React.ComponentType<PropertyLocationMapProps>

/**
 * Mounts the location map only once its slot is within 600 px of the
 * viewport.
 *
 * maplibre-gl is 1 MB of script (270 kB on the wire) and the map sits at the
 * bottom of a property page, so with a static import every property page
 * parsed it during hydration, and every page that links to properties (the
 * home page, the listings) prefetched it as part of the property route
 * (measured 2026-09-30: 3.7 s of main-thread time on a phone). The
 * placeholder has the map's height and stays until the map's code has loaded
 * (next/dynamic rendered nothing in between, and the caption under the map
 * jumped up and back: CLS on a phone, 23.10).
 */
export function PropertyLocationMapLazy(props: PropertyLocationMapProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [LoadedMap, setLoadedMap] = React.useState<MapComponent | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el || LoadedMap) return
    let cancelled = false
    const load = () =>
      import('./PropertyLocationMap').then((m) => {
        if (!cancelled) setLoadedMap(() => m.PropertyLocationMap)
      })
    if (!('IntersectionObserver' in window)) {
      void load()
      return () => {
        cancelled = true
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          void load()
        }
      },
      // 600 px started the 270 KB map library early on desktop.
      { rootMargin: '200px 0px' }
    )
    observer.observe(el)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [LoadedMap])

  if (LoadedMap) return <LoadedMap {...props} />
  return (
    <div
      ref={ref}
      className={cn(
        'w-full box-content rounded-2xl border border-transparent bg-dark/5 dark:bg-white/10',
        props.mapHeightClassName,
        props.className
      )}
      aria-hidden
    />
  )
}
