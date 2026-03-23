'use client'

import * as React from 'react'
import maplibregl from 'maplibre-gl'
import { useCurrency } from '@/contexts/CurrencyContext'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { cn } from '@/lib/utils'

const OSM_DETAILED_STYLE: maplibregl.StyleSpecification = {
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
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

export type PropertiesMapItem = {
  slug: string
  coordinates?: { lat?: number; lng?: number } | null
  price?: number
  currency?: string
  rate?: string
  status?: string
}

type ScopeViewport = {
  center: [number, number]
  zoom: number
}

const ALBANIA_SCOPE: ScopeViewport = {
  center: [20.05, 41.15],
  zoom: 7.2,
}

// Minimal built-in scope presets by slug to avoid relying only on result points.
const CITY_SCOPE_PRESETS: Record<string, ScopeViewport> = {
  tirana: { center: [19.82, 41.33], zoom: 11.2 },
  durres: { center: [19.45, 41.32], zoom: 11.2 },
  vlore: { center: [19.49, 40.47], zoom: 11.2 },
  shkoder: { center: [19.51, 42.07], zoom: 11.2 },
  fier: { center: [19.56, 40.72], zoom: 11.2 },
  elbasan: { center: [20.08, 41.11], zoom: 11.2 },
  sarande: { center: [20.01, 39.88], zoom: 11.2 },
  korce: { center: [20.78, 40.62], zoom: 11.2 },
  berat: { center: [20.03, 40.71], zoom: 11.2 },
  lalez: { center: [19.53, 41.48], zoom: 12.2 },
}

const DISTRICT_SCOPE_PRESETS: Record<string, ScopeViewport> = {
  blloku: { center: [19.81, 41.32], zoom: 13.2 },
  'komuna-e-parisit': { center: [19.80, 41.31], zoom: 13.2 },
  'don-bosko': { center: [19.80, 41.35], zoom: 13.2 },
  fresku: { center: [19.86, 41.35], zoom: 13.2 },
  astir: { center: [19.76, 41.33], zoom: 13.2 },
  plazh: { center: [19.45, 41.30], zoom: 13.0 },
}

export function PropertiesMap({
  items,
  activeSlug,
  onActiveSlugChange,
  mapHeightClassName = 'h-[640px]',
  className,
  selectedCitySlug,
  selectedDistrictSlug,
  selectedDealType,
}: {
  items: PropertiesMapItem[]
  activeSlug?: string | null
  onActiveSlugChange: (slug: string) => void
  mapHeightClassName?: string
  className?: string
  selectedCitySlug?: string
  selectedDistrictSlug?: string
  selectedDealType?: string
}) {
  const { formatFromEur } = useCurrency()
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<MapLibreMap | null>(null)
  const resizeRafRef = React.useRef<number | null>(null)
  const htmlMarkersRef = React.useRef<Map<string, maplibregl.Marker>>(new Map())
  const [ready, setReady] = React.useState(false)
  const prevActiveSlugRef = React.useRef<string | null>(null)

  const scheduleMapResize = React.useCallback(() => {
    if (!mapRef.current) return
    if (resizeRafRef.current != null) {
      cancelAnimationFrame(resizeRafRef.current)
      resizeRafRef.current = null
    }
    resizeRafRef.current = requestAnimationFrame(() => {
      mapRef.current?.resize()
      // Second pass helps after grid/layout transitions.
      requestAnimationFrame(() => {
        mapRef.current?.resize()
      })
    })
  }, [])

  const validPoints = React.useMemo(() => {
    const selectedDeal = (selectedDealType || '').trim().toLowerCase()

    const normalizeDeal = (status?: string) => {
      const s = (status || '').trim().toLowerCase()
      if (s === 'sale') return 'sale'
      if (s === 'rent') return 'rent'
      if (s === 'short-term' || s === 'shortterm') return 'short rent'
      if (s === 'long-term' || s === 'longterm') return 'long rent'
      return ''
    }

    return items
      .map((it) => {
        if (!it.slug) return null
        const lat = it.coordinates?.lat
        const lng = it.coordinates?.lng
        if (typeof lat !== 'number' || typeof lng !== 'number') return null
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

        const priceText =
          typeof it.price === 'number' && Number.isFinite(it.price)
            ? formatFromEur(it.price)
            : it.rate /* legacy fallback when price missing */
              ? it.rate
              : ''
        const dealText = normalizeDeal(it.status)
        const markerLabel = selectedDeal ? priceText : [priceText, dealText].filter(Boolean).join(' ')

        return {
          slug: it.slug,
          lat,
          lng,
          markerLabel,
        }
      })
      .filter(Boolean) as Array<{ slug: string; lat: number; lng: number; markerLabel: string }>
  }, [items, selectedDealType, formatFromEur])

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[PropertiesMap] mounted')
    }
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PropertiesMap] unmounted')
      }
    }
  }, [])

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const activeItem = activeSlug ? items.find((it) => it.slug === activeSlug) : null
    const lat = activeItem?.coordinates?.lat
    const lng = activeItem?.coordinates?.lng
    const activeHasCoords =
      typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng)

    console.log('[PropertiesMap][debug]', {
      itemsCount: items.length,
      validPointsCount: validPoints.length,
      activeSlug,
      activeHasCoords,
    })
  }, [items, validPoints.length, activeSlug])

  const geojson = React.useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: validPoints.map((p) => ({
        type: 'Feature' as const,
        id: p.slug,
        properties: {
          slug: p.slug,
          markerLabel: p.markerLabel,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [p.lng, p.lat] as [number, number],
        },
      })),
    }
  }, [validPoints])

  const selectedScope = React.useMemo(() => {
    const district = (selectedDistrictSlug || '').trim().toLowerCase()
    const city = (selectedCitySlug || '').trim().toLowerCase()
    if (district && DISTRICT_SCOPE_PRESETS[district]) {
      return DISTRICT_SCOPE_PRESETS[district]
    }
    if (city && CITY_SCOPE_PRESETS[city]) {
      return CITY_SCOPE_PRESETS[city]
    }
    return null
  }, [selectedCitySlug, selectedDistrictSlug])

  const clearHtmlMarkers = React.useCallback(() => {
    for (const marker of htmlMarkersRef.current.values()) {
      marker.remove()
    }
    htmlMarkersRef.current.clear()
  }, [])

  const styleMarkerElement = React.useCallback(
    (el: HTMLDivElement, isSelected: boolean) => {
      el.style.display = 'inline-flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.padding = '4px 8px'
      el.style.borderRadius = '9999px'
      el.style.fontSize = '12px'
      el.style.fontWeight = '600'
      el.style.lineHeight = '1.1'
      el.style.whiteSpace = 'nowrap'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.18)'
      el.style.border = isSelected ? '1px solid #07be8a' : '1px solid rgba(0,0,0,0.18)'
      el.style.background = isSelected ? '#07be8a' : '#ffffff'
      el.style.color = isSelected ? '#ffffff' : '#111111'
      el.style.cursor = 'pointer'
      el.style.userSelect = 'none'
    },
    []
  )

  const syncHtmlMarkers = React.useCallback(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const source = map.getSource('properties') as maplibregl.GeoJSONSource | undefined
    if (!source) return

    const rendered = map.querySourceFeatures('properties')
    const unclustered = rendered.filter((f) => {
      const props = (f.properties || {}) as Record<string, unknown>
      return typeof props.point_count !== 'number'
    })

    const next = new Set<string>()
    for (const f of unclustered) {
      const props = (f.properties || {}) as Record<string, unknown>
      const slug = String(props.slug ?? '').trim()
      if (!slug) continue
      const markerLabel = String(props.markerLabel ?? '').trim()
      if (!markerLabel) continue

      const coords = (f.geometry as { coordinates?: unknown })?.coordinates
      if (!Array.isArray(coords) || coords.length < 2) continue
      const lng = Number(coords[0])
      const lat = Number(coords[1])
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

      next.add(slug)
      const isSelected = activeSlug === slug
      const existing = htmlMarkersRef.current.get(slug)
      if (existing) {
        const el = existing.getElement() as HTMLDivElement
        el.textContent = markerLabel
        styleMarkerElement(el, isSelected)
        existing.setLngLat([lng, lat])
        continue
      }

      const el = document.createElement('div')
      el.textContent = markerLabel
      styleMarkerElement(el, isSelected)
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        onActiveSlugChange(slug)
      })

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([lng, lat])
        .addTo(map)

      htmlMarkersRef.current.set(slug, marker)
    }

    for (const [slug, marker] of htmlMarkersRef.current.entries()) {
      if (!next.has(slug)) {
        marker.remove()
        htmlMarkersRef.current.delete(slug)
      }
    }

    if (process.env.NODE_ENV === 'development') {
      const sample = [...htmlMarkersRef.current.keys()].slice(0, 5)
      console.log('[PropertiesMap][dev][html-markers]', {
        zoom: Number(map.getZoom().toFixed(2)),
        count: htmlMarkersRef.current.size,
        sample,
      })
    }
  }, [activeSlug, onActiveSlugChange, ready, styleMarkerElement])

  // Init map once.
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    containerRef.current.style.position = 'relative'
    containerRef.current.style.overflow = 'hidden'

    const initialCenter = validPoints[0]
      ? ({ lng: validPoints[0].lng, lat: validPoints[0].lat } as any)
      : ({ lng: 19.8, lat: 41.3 } as any) // fallback: Albania-ish

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_DETAILED_STYLE,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 6.5,
      attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    mapRef.current = map

    map.on('load', () => {
      map.addSource('properties', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        promoteId: 'slug',
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#07be8a',
          'circle-opacity': 0.25,
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            14,
            10,
            18,
            30,
            22,
          ],
          'circle-stroke-color': '#07be8a',
          'circle-stroke-width': 2,
        },
      })

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#0b0b0b',
        },
      })

      setReady(true)
      scheduleMapResize()
    })

    return () => {
      clearHtmlMarkers()
      map.remove()
      mapRef.current = null
      if (resizeRafRef.current != null) {
        cancelAnimationFrame(resizeRafRef.current)
        resizeRafRef.current = null
      }
    }
    // Intentionally only init once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearHtmlMarkers, scheduleMapResize])

  // Update source data when filtered results change.
  React.useEffect(() => {
    if (!ready || !mapRef.current) return
    const src = mapRef.current.getSource('properties') as maplibregl.GeoJSONSource | undefined
    if (!src) return
    src.setData(geojson as any)
    scheduleMapResize()

    if (process.env.NODE_ENV === 'development') {
      const total = geojson.features.length
      const sampleLabels = geojson.features
        .slice(0, 5)
        .map((f) => String((f.properties as { markerLabel?: unknown })?.markerLabel ?? ''))
      console.log('[PropertiesMap][dev][source-setData]', {
        totalFeatures: total,
        unclusteredFeatures: total, // input data to source before clustering
        sampleMarkerLabels: sampleLabels,
      })
    }
  }, [ready, geojson, scheduleMapResize])

  React.useEffect(() => {
    scheduleMapResize()
  }, [mapHeightClassName, scheduleMapResize])

  React.useEffect(() => {
    if (!containerRef.current || !mapRef.current) return
    const ro = new ResizeObserver(() => {
      scheduleMapResize()
    })
    ro.observe(containerRef.current)
    return () => {
      ro.disconnect()
    }
  }, [scheduleMapResize])

  React.useEffect(() => {
    if (!ready || !mapRef.current) return
    syncHtmlMarkers()
  }, [ready, geojson, activeSlug, syncHtmlMarkers])

  React.useEffect(() => {
    if (!ready || !mapRef.current || process.env.NODE_ENV !== 'development') return
    const map = mapRef.current

    const onMoveEnd = () => {
      const z = map.getZoom()
      let clustered = 0
      let unclustered = 0
      const labels: string[] = []
      try {
        const sourceFeatures = map.querySourceFeatures('properties')
        for (const f of sourceFeatures) {
          const props = (f.properties || {}) as Record<string, unknown>
          if (typeof props.point_count === 'number') {
            clustered += 1
          } else {
            unclustered += 1
            if (labels.length < 5) {
              labels.push(String(props.markerLabel ?? ''))
            }
          }
        }
      } catch {
        // ignore debug read errors
      }
      console.log('[PropertiesMap][dev][moveend]', {
        zoom: Number(z.toFixed(2)),
        clusteredFeatures: clustered,
        unclusteredFeatures: unclustered,
        sampleMarkerLabels: labels,
      })
    }

    map.on('moveend', onMoveEnd)
    onMoveEnd()
    return () => {
      map.off('moveend', onMoveEnd)
    }
  }, [ready])

  // Fly/fit map when results change.
  React.useEffect(() => {
    if (!ready || !mapRef.current) return
    if (activeSlug) return // active selection always has priority

    const map = mapRef.current

    // 1) Selected city/district scope (if known).
    if (selectedScope) {
      if (validPoints.length > 1) {
        const bounds = new maplibregl.LngLatBounds()
        for (const p of validPoints) bounds.extend([p.lng, p.lat] as any)
        map.fitBounds(bounds, {
          padding: 56,
          duration: 500,
          animate: true,
          maxZoom: 13.4,
        })
        return
      }
      if (validPoints.length === 1) {
        const p = validPoints[0]
        map.easeTo({ center: [p.lng, p.lat], zoom: 13.6, duration: 450 })
        return
      }
      map.easeTo({
        center: selectedScope.center,
        zoom: selectedScope.zoom,
        duration: 450,
      })
      return
    }

    // 2) No selected city/district -> Albania overview.
    if (validPoints.length > 1) {
      // Keep overview stable and avoid over-zooming out/in unexpectedly.
      map.easeTo({
        center: ALBANIA_SCOPE.center,
        zoom: ALBANIA_SCOPE.zoom,
        duration: 450,
      })
      return
    }
    if (validPoints.length === 1) {
      const p = validPoints[0]
      map.easeTo({ center: [p.lng, p.lat], zoom: 12.8, duration: 450 })
      return
    }
    map.easeTo({
      center: ALBANIA_SCOPE.center,
      zoom: ALBANIA_SCOPE.zoom,
      duration: 450,
    })
  }, [ready, validPoints, activeSlug, selectedScope])

  // Manage feature-state selection highlight.
  React.useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    const prev = prevActiveSlugRef.current
    const hasPrev = prev ? validPoints.some((p) => p.slug === prev) : false
    const hasActive = activeSlug ? validPoints.some((p) => p.slug === activeSlug) : false

    if (prev && hasPrev) {
      map.setFeatureState({ source: 'properties', id: prev }, { selected: false })
    }

    if (activeSlug && hasActive) {
      map.setFeatureState({ source: 'properties', id: activeSlug }, { selected: true })

      const active = validPoints.find((p) => p.slug === activeSlug)
      if (active) {
          // Ensure the selected point becomes unclustered and clickable.
          map.easeTo({ center: [active.lng, active.lat], zoom: 15, duration: 450 })
      }
    }

    prevActiveSlugRef.current = activeSlug ?? null
  }, [ready, activeSlug, validPoints])

  // Marker click handler.
  React.useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current

    // Cluster click: zoom in.
    const onClusterClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0]
      if (!f) return
      const clusterId = (f.properties as any)?.cluster_id as number | undefined
      if (clusterId == null) return
      const src = map.getSource('properties') as maplibregl.GeoJSONSource
      src
        .getClusterExpansionZoom(clusterId as any)
        .then((zoom) => {
          if (typeof zoom !== 'number') return
          // Keep zoom high enough so unclustered markers become available.
          const z = Math.max(zoom, 15)
          map.easeTo({ center: (f.geometry as any).coordinates as [number, number], zoom: z, duration: 450 })
          requestAnimationFrame(() => syncHtmlMarkers())
        })
        .catch(() => {
          // ignore cluster zoom failures
        })
    }

    map.on('click', 'clusters', onClusterClick)
    map.on('moveend', syncHtmlMarkers)
    map.on('zoomend', syncHtmlMarkers)
    map.on('data', syncHtmlMarkers)

    return () => {
      map.off('click', 'clusters', onClusterClick)
      map.off('moveend', syncHtmlMarkers)
      map.off('zoomend', syncHtmlMarkers)
      map.off('data', syncHtmlMarkers)
    }
  }, [ready, syncHtmlMarkers])

  return (
    <div
      className={cn(
        'w-full relative rounded-2xl overflow-hidden border border-dark/10 dark:border-white/20',
        className,
        'bg-white dark:bg-black',
        '[&_.maplibregl-ctrl-bottom-right]:right-1 [&_.maplibregl-ctrl-bottom-right]:bottom-1',
        '[&_.maplibregl-ctrl.maplibregl-ctrl-attrib]:m-0',
        '[&_.maplibregl-ctrl-attrib]:rounded-md [&_.maplibregl-ctrl-attrib]:border [&_.maplibregl-ctrl-attrib]:border-black/10 dark:[&_.maplibregl-ctrl-attrib]:border-white/20',
        '[&_.maplibregl-ctrl-attrib]:bg-white/70 dark:[&_.maplibregl-ctrl-attrib]:bg-black/60',
        '[&_.maplibregl-ctrl-attrib]:backdrop-blur-[1px]',
        '[&_.maplibregl-ctrl-attrib]:px-1.5 [&_.maplibregl-ctrl-attrib]:py-0.5',
        '[&_.maplibregl-ctrl-attrib]:text-[10px] [&_.maplibregl-ctrl-attrib]:leading-tight',
        '[&_.maplibregl-ctrl-attrib-button]:text-[10px] [&_.maplibregl-ctrl-attrib-button]:leading-none',
        '[&_.maplibregl-ctrl-attrib.maplibregl-compact-show]:p-0'
      )}
    >
      <div ref={containerRef} className={cn('w-full relative overflow-hidden', mapHeightClassName)} />
    </div>
  )
}

