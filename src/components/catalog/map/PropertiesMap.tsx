'use client'

import * as React from 'react'
import maplibregl from 'maplibre-gl'
import { useLocale, useTranslations } from 'next-intl'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatMoney } from '@/lib/currency/format'
import { convertFromBaseEur } from '@/lib/currency/convert'
import { displayDealLabel } from '@/lib/property/cardFormatters'
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

/** Radius of the "somewhere around here" zone drawn for a picked approximate listing. */
const APPROX_ZONE_M = 350
/** Radius of the pad drawn for an exact address with no building in the map data. */
const EXACT_PAD_M = 9

function circlePolygon(lng: number, lat: number, metres: number, steps = 64): GeoJSON.Polygon {
  const ring: number[][] = []
  const dLat = metres / 111_320
  const dLng = metres / (111_320 * Math.cos((lat * Math.PI) / 180))
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI
    ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)])
  }
  return { type: 'Polygon', coordinates: [ring] }
}

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
  const { currency, rates } = useCurrency()
  const locale = useLocale()
  const tMap = useTranslations('Shared.map')
  const tDeal = useTranslations('Shared.propertyDetail')
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


    return items
      .map((it) => {
        if (!it.slug) return null
        const lat = it.coordinates?.lat
        const lng = it.coordinates?.lng
        if (typeof lat !== 'number' || typeof lng !== 'number') return null
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

        // Formatted like the cards (locale and currency), and in the page's
        // language: the pills printed "83 000 € sale" in every locale. Zero is
        // "price on request", never "0 €": such a listing gets a dot.
        const priceText =
          typeof it.price === 'number' && Number.isFinite(it.price) && it.price > 0
            ? formatMoney(convertFromBaseEur(it.price, currency, rates), currency, locale)
            : ''
        const dealText = it.status ? displayDealLabel(it.status, tDeal, { compact: true }) : ''
        const markerLabel = !priceText ? '' : selectedDeal ? priceText : [priceText, dealText].filter(Boolean).join(' · ')

        const approximate = it.locationPrecision === 'approximate'

        return {
          slug: it.slug,
          lat,
          lng,
          markerLabel,
          approximate,
          pill: it.pill !== false && markerLabel !== '',
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
  }, [items, selectedDealType, currency, rates, locale, tDeal])

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
      // The control tooltips in the page's language (they were English).
      locale: {
        'NavigationControl.ZoomIn': tMap('zoomIn'),
        'NavigationControl.ZoomOut': tMap('zoomOut'),
        'NavigationControl.ResetBearing': tMap('resetBearing'),
      },
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
        // Clusters hold out a zoom level longer than before: at 14 the beach
        // front became a wall of overlapping pills.
        clusterMaxZoom: 15,
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

      // A picked approximate listing has no building; the zone it is in is
      // drawn instead (see the selection effect).
      map.addSource('approx-zone', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer(
        {
          id: 'approx-zone-fill',
          type: 'fill',
          source: 'approx-zone',
          paint: { 'fill-color': LISTING_BUILDING_COLOR, 'fill-opacity': 0.12 },
        },
        'clusters'
      )
      map.addLayer(
        {
          id: 'approx-zone-line',
          type: 'line',
          source: 'approx-zone',
          paint: { 'line-color': LISTING_BUILDING_COLOR, 'line-width': 1.5, 'line-dasharray': [2, 2] },
        },
        'clusters'
      )

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
            // A building with no height in OpenStreetMap still stands out; the
            // pad for an unmapped building stays low.
            'fill-extrusion-height': [
              'max',
              ['coalesce', ['get', 'render_height'], 0],
              ['case', ['==', ['get', 'render_height'], 3], 3, 9],
            ],
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
      // A remount (Fast Refresh, Strict Mode) builds a new map whose style
      // has not loaded yet; effects must wait for its own 'load'.
      setReady(false)
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
          // Every building feature under the pin, not just the first: the
          // first can be a merged block whose part under the pin is elsewhere.
          const hits = map.queryRenderedFeatures(map.project([p.lng, p.lat]), {
            layers: ['listing-building-footprints'],
          })
          let geometry: GeoJSON.Polygon | null = null
          let props: Record<string, unknown> | null = null
          for (const hit of hits) {
            geometry = buildingPolygonAt(hit.geometry, p.lng, p.lat)
            if (geometry) {
              props = hit.properties ?? {}
              break
            }
          }
          // An exact address in a building OpenStreetMap does not have yet
          // (most new builds): a small green pad on the spot instead.
          if (!geometry) {
            geometry = circlePolygon(p.lng, p.lat, EXACT_PAD_M, 24)
            props = { render_height: 3, render_min_height: 0 }
          }
          const key = JSON.stringify(geometry.coordinates[0])
          if (seen.has(key)) continue
          seen.add(key)
          features.push({
            type: 'Feature',
            geometry,
            properties: {
              render_height: props?.render_height,
              render_min_height: props?.render_min_height,
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

  // Once the visitor has moved the map, new points (the full set arriving,
  // "Show more") must not throw the camera back; a new place resets that.
  const userMovedRef = React.useRef(false)
  React.useEffect(() => {
    userMovedRef.current = false
  }, [selectedCitySlug, selectedDistrictSlug, selectedDealType])
  React.useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const onMoveStart = (e: { originalEvent?: unknown }) => {
      if (e.originalEvent) userMovedRef.current = true
    }
    map.on('movestart', onMoveStart)
    return () => {
      map.off('movestart', onMoveStart)
    }
  }, [ready])

  // Fly/fit map when results change.
  React.useEffect(() => {
    if (!ready || !mapRef.current) return
    if (activeSlug) return // active selection always has priority
    if (userMovedRef.current) return

    const map = mapRef.current

    // 1) A city or district: fit its listings (every city, not only those
    // with a preset; Shëngjin opened on the whole country). Points more than
    // 25 km from the median are left out of the fit, so one misplaced pin
    // cannot zoom a city out to half of Albania.
    if (selectedScope || selectedCitySlug || selectedDistrictSlug) {
      if (validPoints.length > 1) {
        const median = (xs: number[]) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]
        const mLat = median(validPoints.map((p) => p.lat))
        const mLng = median(validPoints.map((p) => p.lng))
        const near = validPoints.filter(
          (p) => Math.abs(p.lat - mLat) * 111 < 25 && Math.abs(p.lng - mLng) * 111 * Math.cos((mLat * Math.PI) / 180) < 25
        )
        const bounds = new maplibregl.LngLatBounds()
        for (const p of near.length ? near : validPoints) bounds.extend([p.lng, p.lat])
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
      if (selectedScope) {
        map.easeTo({
          center: selectedScope.center,
          zoom: selectedScope.zoom,
          duration: 450,
        })
        return
      }
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

    const zone = map.getSource('approx-zone') as maplibregl.GeoJSONSource | undefined
    const activePoint = activeSlug ? validPoints.find((p) => p.slug === activeSlug) : undefined
    zone?.setData({
      type: 'FeatureCollection',
      features:
        activePoint?.approximate
          ? [{ type: 'Feature', properties: {}, geometry: circlePolygon(activePoint.lng, activePoint.lat, APPROX_ZONE_M) }]
          : [],
    })

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

    // Cluster click: show its listings. Fitting their bounds rather than
    // zooming on the cluster's centre: along the coast that centre is an
    // average of points on a curve and sits out at sea, leaving half the view
    // water. Falls back to the expansion zoom when the leaves are unavailable.
    const onClusterClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0]
      if (!f) return
      const clusterId = (f.properties as { cluster_id?: number } | null)?.cluster_id
      if (clusterId == null) return
      userMovedRef.current = true
      const src = map.getSource('properties') as maplibregl.GeoJSONSource
      const center = (f.geometry as GeoJSON.Point).coordinates as [number, number]
      src
        .getClusterLeaves(clusterId, 5000, 0)
        .then((leaves) => {
          const bounds = new maplibregl.LngLatBounds()
          for (const leaf of leaves) bounds.extend((leaf.geometry as GeoJSON.Point).coordinates as [number, number])
          if (bounds.isEmpty()) throw new Error('no leaves')
          map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 500 })
        })
        .catch(() =>
          src.getClusterExpansionZoom(clusterId).then((zoom) => {
            map.easeTo({ center, zoom: Math.max(zoom, 15), duration: 450 })
          })
        )
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
        // Zoom/compass buttons follow the site's dark theme.
        'dark:[&_.maplibregl-ctrl-group]:bg-dark dark:[&_.maplibregl-ctrl-group]:border dark:[&_.maplibregl-ctrl-group]:border-white/20',
        'dark:[&_.maplibregl-ctrl-group_button+button]:border-white/20 dark:[&_.maplibregl-ctrl-icon]:invert',
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
          // One line: the two-line version covered a strip of the map. The
          // full sentence is the tooltip and the accessible text.
          className="absolute left-2 top-2 z-10 max-w-[calc(100%-4.5rem)] truncate rounded-md border border-black/10 bg-white/85 px-2 py-1 text-[11px] leading-tight text-dark/80 backdrop-blur-[1px] dark:border-white/20 dark:bg-black/60 dark:text-white/80 sm:max-w-[65%]"
          title={tMap('approximateLegend')}
          aria-label={tMap('approximateLegend')}
        >
          ≈ {tMap('approximateShort')}
        </div>
      ) : null}
    </div>
  )
}

