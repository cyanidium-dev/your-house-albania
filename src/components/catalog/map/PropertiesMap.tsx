'use client'

import * as React from 'react'
import maplibregl from 'maplibre-gl'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/contexts/CurrencyContext'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { cn } from '@/lib/utils'
import { buildingPolygonAt } from './buildingPolygonAt'

// OpenFreeMap's vector "Liberty" style: free, no key, OpenStreetMap data with
// building heights, so the map can tilt into 3D (`building-3d` is its
// fill-extrusion layer from zoom 14). Its glyph server serves Noto Sans only.
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const MAP_FONT = ['Noto Sans Bold']
const PITCH_3D = 55
const BEARING_3D = -17
// Buildings start at zoom 14 in the style; the listing highlight follows.
const BUILDINGS_MIN_ZOOM = 14
const LISTING_BUILDING_COLOR = '#078660'
const MODE_STORAGE_KEY = 'domlivo:map-mode'

type MapMode = '2d' | '3d'

function initialMapMode(): MapMode {
  if (typeof window === 'undefined') return '2d'
  try {
    const saved = window.localStorage.getItem(MODE_STORAGE_KEY)
    if (saved === '2d' || saved === '3d') return saved
  } catch {
    // storage blocked: fall through to the default
  }
  // Flat by default (research 2026-10-10): a tilted map is harder to pan and
  // to read prices on, and draws more on a weaker GPU. 3D is one tap away.
  return '2d'
}

export type PropertiesMapItem = {
  slug: string
  coordinates?: { lat?: number; lng?: number } | null
  /** 'approximate': the pin is the district or a nearby landmark, not the building. */
  locationPrecision?: 'exact' | 'approximate'
  price?: number
  currency?: string
  rate?: string
  status?: string
  /** false: a dot instead of a price pill (listings not among the loaded cards). Default true. */
  pill?: boolean
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
  highlightSlug,
  expanded = false,
  onExpandedChange,
}: {
  items: PropertiesMapItem[]
  activeSlug?: string | null
  onActiveSlugChange: (slug: string) => void
  mapHeightClassName?: string
  className?: string
  selectedCitySlug?: string
  selectedDistrictSlug?: string
  selectedDealType?: string
  /** The listing whose card the pointer is on; its pin or dot lights up. */
  highlightSlug?: string | null
  /** Full-screen state is owned by the caller, which also positions the preview card. */
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}) {
  const { formatFromEur } = useCurrency()
  const tMap = useTranslations('Shared.map')
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<MapLibreMap | null>(null)
  const resizeRafRef = React.useRef<number | null>(null)
  const htmlMarkersRef = React.useRef<Map<string, maplibregl.Marker>>(new Map())
  const [ready, setReady] = React.useState(false)
  const [mode, setMode] = React.useState<MapMode>(initialMapMode)
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

        const approximate = it.locationPrecision === 'approximate'

        return {
          slug: it.slug,
          lat,
          lng,
          markerLabel,
          approximate,
          pill: it.pill !== false,
        }
      })
      .filter(Boolean) as Array<{
        slug: string
        lat: number
        lng: number
        markerLabel: string
        approximate: boolean
        pill: boolean
      }>
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

  const hasApproximate = React.useMemo(() => validPoints.some((p) => p.approximate), [validPoints])

  const geojson = React.useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: validPoints.map((p) => ({
        type: 'Feature' as const,
        id: p.slug,
        properties: {
          slug: p.slug,
          markerLabel: p.markerLabel,
          approximate: p.approximate,
          pill: p.pill,
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

  // An approximate pin reads differently from an exact one: dashed outline and
  // a "≈" before the price, with the legend under the map explaining it. Most
  // partner listings arrive without an address, so this is the common case.
  const styleMarkerElement = React.useCallback(
    (el: HTMLDivElement, isSelected: boolean, approximate = false, highlighted = false) => {
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
      el.style.border = isSelected
        ? '1px solid #078660'
        : highlighted
          ? '2px solid #078660'
          : approximate
          ? '1px dashed rgba(0,0,0,0.45)'
          : '1px solid rgba(0,0,0,0.18)'
      el.style.background = isSelected ? '#078660' : highlighted ? '#e8f5ef' : approximate ? '#f7f7f5' : '#ffffff'
      el.style.zIndex = isSelected || highlighted ? '2' : ''
      el.style.color = isSelected ? '#ffffff' : '#111111'
      el.style.cursor = 'pointer'
      el.style.userSelect = 'none'
    },
    []
  )

  const highlightRef = React.useRef<string | null>(null)

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

    // A tilted map shows kilometres of coast towards the horizon, and every
    // pin out there becomes an unreadable price pill on top of the others.
    // Keep the pins in the nearer part of the view; the far ones come back as
    // the visitor pans towards them.
    const pitched = map.getPitch() > 20
    const farEdgeY = map.getCanvas().clientHeight * 0.3

    const next = new Set<string>()
    for (const f of unclustered) {
      const props = (f.properties || {}) as Record<string, unknown>
      const slug = String(props.slug ?? '').trim()
      if (!slug) continue
      const rawLabel = String(props.markerLabel ?? '').trim()
      if (!rawLabel) continue
      const approximate = props.approximate === true || props.approximate === 'true'
      // Listings beyond the loaded cards are dots (the `points-dot` layer)
      // until one is picked.
      const pill = props.pill !== false && props.pill !== 'false'
      if (!pill && slug !== activeSlug) continue
      const markerLabel = approximate ? `≈ ${rawLabel}` : rawLabel

      const coords = (f.geometry as { coordinates?: unknown })?.coordinates
      if (!Array.isArray(coords) || coords.length < 2) continue
      const lng = Number(coords[0])
      const lat = Number(coords[1])
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      if (pitched && slug !== activeSlug && map.project([lng, lat]).y < farEdgeY) continue

      next.add(slug)
      const isSelected = activeSlug === slug
      const highlighted = highlightRef.current === slug
      const existing = htmlMarkersRef.current.get(slug)
      if (existing) {
        const el = existing.getElement() as HTMLDivElement
        el.textContent = markerLabel
        styleMarkerElement(el, isSelected, approximate, highlighted)
        existing.setLngLat([lng, lat])
        continue
      }

      const el = document.createElement('div')
      el.textContent = markerLabel
      styleMarkerElement(el, isSelected, approximate, highlighted)
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
      style: MAP_STYLE_URL,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 6.5,
      pitch: mode === '3d' ? PITCH_3D : 0,
      bearing: mode === '3d' ? BEARING_3D : 0,
      maxPitch: 70,
      attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    // Zoom buttons and a compass that also shows the tilt; a tap on the
    // compass turns the map back north.
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')

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
          'circle-color': '#078660',
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
          'circle-stroke-color': '#078660',
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
          // Only stacks the style's glyph server has (Noto Sans): an unknown
          // stack answers 404 for every range and the counts fall back to
          // local fonts after a failed request per cluster.
          'text-font': MAP_FONT,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#0b0b0b',
        },
      })

      // Every listing in the filter that is not among the loaded cards: a dot,
      // not a price pill (research 2026-10-10: hundreds of overlapping pills
      // on the Durrës front were unreadable). Grey for approximate places.
      map.addLayer({
        id: 'points-dot',
        type: 'circle',
        source: 'properties',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'pill'], false]],
        paint: {
          'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 8, 5],
          'circle-color': ['case', ['==', ['get', 'approximate'], true], '#8a9490', LISTING_BUILDING_COLOR],
          'circle-opacity': ['case', ['==', ['get', 'approximate'], true], 0.8, 1],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      })

      // Buildings that hold a listing with an exact address, drawn over the
      // style's grey extrusions in the brand colour. The footprints come from
      // the tiles themselves (see the highlight effect below): an invisible
      // flat copy of the building layer is what the pins are tested against.
      map.addLayer(
        {
          id: 'listing-building-footprints',
          type: 'fill',
          source: 'openmaptiles',
          'source-layer': 'building',
          minzoom: BUILDINGS_MIN_ZOOM,
          paint: { 'fill-opacity': 0 },
        },
        'clusters'
      )
      map.addSource('listing-buildings', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer(
        {
          id: 'listing-buildings',
          type: 'fill-extrusion',
          source: 'listing-buildings',
          minzoom: BUILDINGS_MIN_ZOOM,
          paint: {
            'fill-extrusion-color': LISTING_BUILDING_COLOR,
            'fill-extrusion-opacity': 0.85,
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            // A building with no height in OpenStreetMap still stands out.
            'fill-extrusion-height': ['max', ['coalesce', ['get', 'render_height'], 0], 9],
          },
        },
        'clusters'
      )

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

  // 2D / 3D: tilt and turn the camera. The buildings are in the style either
  // way, seen from straight above in 2D.
  const firstModeRunRef = React.useRef(true)
  React.useEffect(() => {
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode)
    } catch {
      // storage blocked: the choice lasts for this page only
    }
    const map = mapRef.current
    if (!ready || !map) return
    if (firstModeRunRef.current) {
      firstModeRunRef.current = false
      return
    }
    map.easeTo({
      pitch: mode === '3d' ? PITCH_3D : 0,
      bearing: mode === '3d' ? BEARING_3D : 0,
      duration: 600,
    })
  }, [mode, ready])

  // Highlight the building under every exact pin in view. The tiles carry the
  // footprints and heights; a pin is tested against the invisible flat copy of
  // the building layer at its screen position, which holds at any tilt.
  // Approximate pins are skipped: they mark a district, not a house.
  const exactPointsRef = React.useRef<Array<{ lng: number; lat: number }>>([])
  React.useEffect(() => {
    exactPointsRef.current = validPoints.filter((p) => !p.approximate).map((p) => ({ lng: p.lng, lat: p.lat }))
  }, [validPoints])
  React.useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current
    let lastKey = ''
    const update = () => {
      const src = map.getSource('listing-buildings') as maplibregl.GeoJSONSource | undefined
      if (!src) return
      const features: GeoJSON.Feature[] = []
      const seen = new Set<string>()
      if (map.getZoom() >= BUILDINGS_MIN_ZOOM) {
        const bounds = map.getBounds()
        for (const p of exactPointsRef.current) {
          if (!bounds.contains([p.lng, p.lat])) continue
          const hit = map.queryRenderedFeatures(map.project([p.lng, p.lat]), {
            layers: ['listing-building-footprints'],
          })[0]
          if (!hit) continue
          const geometry = buildingPolygonAt(hit.geometry, p.lng, p.lat)
          if (!geometry) continue
          const key = JSON.stringify(geometry.coordinates[0])
          if (seen.has(key)) continue
          seen.add(key)
          features.push({
            type: 'Feature',
            geometry,
            properties: {
              render_height: hit.properties?.render_height,
              render_min_height: hit.properties?.render_min_height,
            },
          })
        }
      }
      // `idle` follows every settled frame, including the one this setData
      // causes; only a different set of buildings is worth a redraw.
      const key = [...seen].join('|')
      if (key === lastKey) return
      lastKey = key
      src.setData({ type: 'FeatureCollection', features })
    }
    map.on('idle', update)
    update()
    return () => {
      map.off('idle', update)
    }
  }, [ready])

  // Full screen: Escape closes it, and the page behind does not scroll.
  React.useEffect(() => {
    scheduleMapResize()
    if (!expanded || !onExpandedChange) return
    const onKey = (ev: KeyboardEvent) => {
      // Escape in an enquiry dialog opened from the map closes the dialog only.
      if (ev.key === 'Escape' && !document.documentElement.dataset.contactModal) onExpandedChange(false)
    }
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [expanded, onExpandedChange, scheduleMapResize])

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
          // Close enough for the point to leave its cluster, never further out
          // than the visitor already is; and centred in the upper part of the
          // map, since the listing window covers the lower part.
          map.easeTo({
            center: [active.lng, active.lat],
            zoom: Math.max(map.getZoom(), 15),
            offset: [0, -Math.round(map.getContainer().clientHeight * 0.22)],
            duration: 450,
          })
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

    // One marker pass per frame at most. `data` fires for every raster tile
    // that arrives (dozens on a pan), and each pass queries all pins — with
    // the whole city on the map (600+) that kept the main thread busy.
    let frame: number | null = null
    const scheduleSync = () => {
      if (frame != null) return
      frame = requestAnimationFrame(() => {
        frame = null
        syncHtmlMarkers()
      })
    }
    const onData = (e: maplibregl.MapDataEvent & { sourceId?: string }) => {
      if (e.dataType === 'source' && e.sourceId === 'properties') scheduleSync()
    }

    const onDotClick = (e: maplibregl.MapLayerMouseEvent) => {
      const slug = String((e.features?.[0]?.properties as { slug?: unknown } | undefined)?.slug ?? '')
      if (slug) onActiveSlugChange(slug)
    }
    const pointer = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const noPointer = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', 'clusters', onClusterClick)
    map.on('click', 'points-dot', onDotClick)
    map.on('mouseenter', 'points-dot', pointer)
    map.on('mouseleave', 'points-dot', noPointer)
    map.on('mouseenter', 'clusters', pointer)
    map.on('mouseleave', 'clusters', noPointer)
    map.on('moveend', scheduleSync)
    map.on('zoomend', scheduleSync)
    map.on('data', onData)

    return () => {
      if (frame != null) cancelAnimationFrame(frame)
      map.off('click', 'clusters', onClusterClick)
      map.off('click', 'points-dot', onDotClick)
      map.off('mouseenter', 'points-dot', pointer)
      map.off('mouseleave', 'points-dot', noPointer)
      map.off('mouseenter', 'clusters', pointer)
      map.off('mouseleave', 'clusters', noPointer)
      map.off('moveend', scheduleSync)
      map.off('zoomend', scheduleSync)
      map.off('data', onData)
    }
  }, [ready, syncHtmlMarkers, onActiveSlugChange])

  // Card hover: light up that listing's pill, or its dot. Restyles the two
  // markers involved instead of a full marker pass on every pointer move.
  React.useEffect(() => {
    const map = mapRef.current
    const prev = highlightRef.current
    const next = highlightSlug ?? null
    highlightRef.current = next
    if (!ready || !map || prev === next) return
    const known = (slug: string | null) => (slug ? validPoints.find((p) => p.slug === slug) : undefined)
    for (const slug of [prev, next]) {
      const point = known(slug)
      if (!slug || !point) continue
      const on = slug === next
      const marker = htmlMarkersRef.current.get(slug)
      if (marker) styleMarkerElement(marker.getElement() as HTMLDivElement, activeSlug === slug, point.approximate, on)
      if (!point.pill) map.setFeatureState({ source: 'properties', id: slug }, { hover: on })
    }
  }, [highlightSlug, ready, validPoints, activeSlug, styleMarkerElement])

  return (
    <div
      className={cn(
        'w-full relative overflow-hidden',
        expanded ? 'h-full' : 'rounded-2xl border border-dark/10 dark:border-white/20',
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
      <div ref={containerRef} className={cn('w-full relative overflow-hidden', expanded ? 'h-full' : mapHeightClassName)} />
      <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-2">
        {onExpandedChange ? (
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white/95 text-dark shadow-md hover:bg-white dark:border-white/20 dark:bg-black/80 dark:text-white"
            aria-label={expanded ? tMap('exitFullscreen') : tMap('enterFullscreen')}
            title={expanded ? tMap('exitFullscreen') : tMap('enterFullscreen')}
          >
            {expanded ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            )}
          </button>
        ) : null}
        <div
          role="group"
          aria-label={tMap('viewMode')}
          className="flex overflow-hidden rounded-lg border border-black/10 bg-white/95 text-xs font-semibold shadow-md dark:border-white/20 dark:bg-black/80"
        >
          {(['2d', '3d'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                'h-9 w-10 transition-colors',
                mode === m ? 'bg-primary text-white' : 'text-dark hover:bg-dark/5 dark:text-white dark:hover:bg-white/10'
              )}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {hasApproximate ? (
        <div
          className="pointer-events-none absolute left-2 right-14 top-2 z-10 sm:right-auto sm:max-w-[65%] rounded-md border border-black/10 bg-white/85 px-2 py-1 text-[11px] leading-tight text-dark/80 backdrop-blur-[1px] dark:border-white/20 dark:bg-black/60 dark:text-white/80"
          aria-live="polite"
        >
          {tMap('approximateLegend')}
        </div>
      ) : null}
    </div>
  )
}

