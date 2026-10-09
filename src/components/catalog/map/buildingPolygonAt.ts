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
