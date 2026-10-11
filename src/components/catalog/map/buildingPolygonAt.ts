function ringContains(ring: number[][], x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/**
 * The one building under a point. The vector tiles merge neighbouring
 * buildings with the same attributes into a single MultiPolygon, so the
 * feature a pin hits can be a whole block (on the Durrës beach front it lit
 * up dozens of houses); keep only the polygon that contains the pin.
 */
export function buildingPolygonAt(geometry: GeoJSON.Geometry, lng: number, lat: number): GeoJSON.Polygon | null {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : []
  for (const rings of polygons) {
    const [outer, ...holes] = rings
    if (!outer || !ringContains(outer, lng, lat)) continue
    if (holes.some((h) => ringContains(h, lng, lat))) continue
    return { type: 'Polygon', coordinates: rings }
  }
  return null
}

/**
 * The footprint pushed outward by `metres` (each vertex away from the ring's
 * centre), holes dropped. The highlight is drawn over the style's own grey
 * extrusion of the same building; with identical walls and roof the GPU could
 * not tell which face is in front and the green flickered as the camera
 * moved (z-fighting). A slightly larger, taller shell has no shared face.
 */
export function inflatePolygon(polygon: GeoJSON.Polygon, metres: number): GeoJSON.Polygon {
  const outer = polygon.coordinates[0]
  if (!outer || outer.length < 4) return polygon
  const pts = outer.slice(0, -1)
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const mPerDegLat = 111_320
  const mPerDegLng = 111_320 * Math.cos((cy * Math.PI) / 180)
  const ring = pts.map(([x, y]) => {
    const dx = (x - cx) * mPerDegLng
    const dy = (y - cy) * mPerDegLat
    const d = Math.hypot(dx, dy)
    if (d === 0) return [x, y]
    const k = (d + metres) / d
    return [cx + (dx * k) / mPerDegLng, cy + (dy * k) / mPerDegLat]
  })
  ring.push(ring[0])
  return { type: 'Polygon', coordinates: [ring] }
}
