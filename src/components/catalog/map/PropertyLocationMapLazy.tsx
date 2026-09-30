'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { PropertyLocationMapProps } from './PropertyLocationMap'

const PropertyLocationMap = dynamic(
  () => import('./PropertyLocationMap').then((m) => m.PropertyLocationMap),
  { ssr: false, loading: () => null }
)

/**
 * Mounts the location map only once its slot is within 600 px of the
 * viewport.
 *
 * maplibre-gl is 1 MB of script (270 kB on the wire) and the map sits at the
 * bottom of a property page, so with a static import every property page
 * parsed it during hydration, and every page that links to properties (the
 * home page, the listings) prefetched it as part of the property route
 * (measured 2026-09-30: 3.7 s of main-thread time on a phone). The
 * placeholder has the map's height, so nothing moves when it loads.
 */
export function PropertyLocationMapLazy(props: PropertyLocationMapProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [near, setNear] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el || near) return
    if (!('IntersectionObserver' in window)) {
      setNear(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [near])

  if (near) return <PropertyLocationMap {...props} />
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
