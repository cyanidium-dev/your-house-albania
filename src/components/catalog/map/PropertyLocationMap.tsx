'use client'

import * as React from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { cn } from '@/lib/utils'

/** Default center when property coordinates are missing. Matches PropertiesMap fallback. */
export const DEFAULT_MAP_CENTER: [number, number] = [20.05, 41.15]
const DEFAULT_ZOOM = 14

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'osm', type: 'raster', source: 'osm' },
  ],
}

export type PropertyLocationMapProps = {
  /** lat/lng. When null, uses DEFAULT_MAP_CENTER. */
  coordinates: { lat: number; lng: number } | null
  className?: string
  mapHeightClassName?: string
}

function resolveCenter(coords: { lat: number; lng: number } | null): [number, number] {
  if (coords == null) return DEFAULT_MAP_CENTER
  const lat = coords.lat
  const lng = coords.lng
  if (typeof lat !== 'number' || typeof lng !== 'number') return DEFAULT_MAP_CENTER
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return DEFAULT_MAP_CENTER
  return [lng, lat]
}

export function PropertyLocationMap({
  coordinates,
  className,
  mapHeightClassName = 'h-[420px]',
}: PropertyLocationMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<MapLibreMap | null>(null)
  const markerRef = React.useRef<maplibregl.Marker | null>(null)

  const center = React.useMemo(() => resolveCenter(coordinates), [coordinates])
  const hasValidCoords = coordinates != null &&
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    Number.isFinite(coordinates.lat) &&
    Number.isFinite(coordinates.lng)

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    mapRef.current = map

    const addMarker = () => {
      if (!hasValidCoords || !coordinates) return
      markerRef.current?.remove()
      const el = document.createElement('div')
      el.className = 'w-6 h-6 bg-primary rounded-full border-2 border-white shadow-md'
      el.setAttribute('aria-hidden', 'true')
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map)
      markerRef.current = marker
    }

    map.on('load', addMarker)
    if (map.loaded()) addMarker()

    return () => {
      map.off('load', addMarker)
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [center, hasValidCoords, coordinates])

  return (
    <div
      className={cn(
        'w-full relative rounded-2xl overflow-hidden border border-dark/10 dark:border-white/20',
        'bg-white dark:bg-black',
        '[&_.maplibregl-ctrl-bottom-right]:right-1 [&_.maplibregl-ctrl-bottom-right]:bottom-1',
        '[&_.maplibregl-ctrl-attrib]:rounded-md [&_.maplibregl-ctrl-attrib]:border [&_.maplibregl-ctrl-attrib]:border-black/10 dark:[&_.maplibregl-ctrl-attrib]:border-white/20',
        '[&_.maplibregl-ctrl-attrib]:bg-white/70 dark:[&_.maplibregl-ctrl-attrib]:bg-black/60',
        '[&_.maplibregl-ctrl-attrib]:text-[10px]',
        className
      )}
    >
      <div ref={containerRef} className={cn('w-full relative overflow-hidden', mapHeightClassName)} />
    </div>
  )
}
