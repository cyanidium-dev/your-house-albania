/**
 * Listings that share a building. Flats in one block carry the block's
 * coordinates, so their pins sat exactly on top of each other and only the
 * top one could be reached (Liburna in Golem: 11 flats on one point). Points
 * equal to five decimals, about a metre, are one building.
 *
 * Pure, so the map (one marker per building) and the preview window (the
 * "1 / 11" pager) group and order the same listings the same way.
 */

export type StackPoint = {
  slug: string
  lat: number
  lng: number
  /** Total price in base EUR; null for none, zero ("on request") or a per-m² rate. */
  total: number | null
  approximate: boolean
}

export function stackKeyOf(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}

/** A price a building can be "from": a per-m² rate is not a total, zero is "on request". */
export function stackTotalOf(price: unknown, priceUnit?: string | null): number | null {
  return typeof price === 'number' && Number.isFinite(price) && price > 0 && priceUnit !== 'per-sqm' ? price : null
}

/** The same checks the map applies before it draws a point. */
export function stackPointOf(item: {
  slug?: string | null
  coordinates?: { lat?: number; lng?: number } | null
  price?: number
  priceUnit?: string | null
  locationPrecision?: string | null
}): StackPoint | null {
  const lat = item.coordinates?.lat
  const lng = item.coordinates?.lng
  if (!item.slug || typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    slug: item.slug,
    lat,
    lng,
    total: stackTotalOf(item.price, item.priceUnit),
    approximate: item.locationPrecision === 'approximate',
  }
}

function compareMembers(a: StackPoint, b: StackPoint): number {
  if (a.total != null && b.total != null && a.total !== b.total) return a.total - b.total
  if ((a.total == null) !== (b.total == null)) return a.total == null ? 1 : -1
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0
}

/**
 * Every listing that shares its point with another, mapped to its whole
 * group. Cheapest first, so the first card opened is the "from" price on the
 * pin; listings without a total last; ties by slug, so the order does not
 * depend on the order the points arrived in. Single listings are absent.
 * One pass over the points with a Map; sorting touches only the groups.
 */
export function groupBuildingStacks<T extends StackPoint>(points: readonly T[]): Map<string, T[]> {
  const byKey = new Map<string, T[]>()
  const seen = new Set<string>()
  for (const p of points) {
    if (seen.has(p.slug)) continue
    seen.add(p.slug)
    const key = stackKeyOf(p.lat, p.lng)
    const group = byKey.get(key)
    if (group) group.push(p)
    else byKey.set(key, [p])
  }
  const bySlug = new Map<string, T[]>()
  for (const group of byKey.values()) {
    if (group.length < 2) continue
    group.sort(compareMembers)
    for (const p of group) bySlug.set(p.slug, group)
  }
  return bySlug
}
