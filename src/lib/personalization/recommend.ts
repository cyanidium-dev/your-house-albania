/**
 * "Welcome back": listings picked from what a returning visitor looked at
 * (experiment E005, docs/experiments/005-welcome-back-feed.md).
 *
 * The browser sends only the slugs it viewed and when its last visit ended;
 * the profile (city, type, rooms, budget) is read here from the catalog
 * snapshot, so a client cannot steer the result with made-up criteria.
 * Pure: the route feeds it the cached snapshot.
 */
import type { CatalogItem, CatalogSnapshot } from '@/lib/ai/catalogSnapshot'

export const MAX_VIEWED_SLUGS = 20
export const MAX_PICKS = 6
export const MAX_FRESH = 6

export type RecommendCriteria = {
  city?: string
  type?: string
  /** Bedrooms the visitor looked at, smallest and largest (a studio is 0). */
  minBedrooms?: number
  maxBedrooms?: number
  /** Budget band read from the viewed prices, EUR. */
  minPrice?: number
  maxPrice?: number
  districts: string[]
}

export type Recommendation = {
  criteria: RecommendCriteria
  picks: string[]
  fresh: string[]
  /** All new matches since the last visit; `fresh` holds the first few. */
  freshCount: number
}

/** The most frequent value; on a tie, the one seen last (the freshest interest). */
function mode(values: string[]): string | undefined {
  const counts = new Map<string, number>()
  let best: string | undefined
  let bestCount = 0
  for (const v of values) {
    if (!v) continue
    const c = (counts.get(v) ?? 0) + 1
    counts.set(v, c)
    if (c >= bestCount) {
      best = v
      bestCount = c
    }
  }
  return best
}

/** What the viewed listings have in common; `null` when none of them is in the catalog any more. */
export function criteriaFromViews(viewed: CatalogItem[]): RecommendCriteria | null {
  if (viewed.length === 0) return null
  const city = mode(viewed.map((i) => i.city))
  const type = mode(viewed.map((i) => i.type))
  const sameCity = viewed.filter((i) => !city || i.city === city)
  const rooms = sameCity.map((i) => i.bedrooms)
  const prices = sameCity.map((i) => i.price).filter((p) => p > 0)
  return {
    ...(city ? { city } : {}),
    ...(type ? { type } : {}),
    ...(rooms.length ? { minBedrooms: Math.min(...rooms), maxBedrooms: Math.max(...rooms) } : {}),
    ...(prices.length
      ? { minPrice: Math.round(Math.min(...prices) * 0.7), maxPrice: Math.round(Math.max(...prices) * 1.2) }
      : {}),
    districts: [...new Set(sameCity.map((i) => i.district).filter(Boolean))],
  }
}

/** How well a listing fits; a different city is never a fit. */
export function scoreItem(item: CatalogItem, c: RecommendCriteria): number {
  if (c.city && item.city !== c.city) return -1
  let score = 0
  if (c.type && item.type === c.type) score += 3
  if (c.minBedrooms !== undefined && c.maxBedrooms !== undefined) {
    if (item.bedrooms >= c.minBedrooms && item.bedrooms <= c.maxBedrooms) score += 3
    else if (item.bedrooms >= c.minBedrooms - 1 && item.bedrooms <= c.maxBedrooms + 1) score += 1
  }
  if (c.maxPrice !== undefined && item.price > 0) {
    // Far above the budget is not "for you", however well the rest fits.
    if (item.price > c.maxPrice * 1.5) return -1
    if (item.price >= (c.minPrice ?? 0) && item.price <= c.maxPrice) score += 3
    else if (item.price <= c.maxPrice * 1.25) score += 1
  }
  if (item.district && c.districts.includes(item.district)) score += 2
  return score
}

const PICK_MIN_SCORE = 6
// As strict as the picks: a bulk import makes hundreds of listings "new" in the same city.
const FRESH_MIN_SCORE = 6

export function recommend(
  snapshot: CatalogSnapshot,
  viewedSlugs: string[],
  since: Date | null,
): Recommendation | null {
  const bySlug = new Map(snapshot.items.map((i) => [i.slug, i]))
  const seen = new Set(viewedSlugs)
  const viewed = viewedSlugs.map((s) => bySlug.get(s)).filter((i): i is CatalogItem => Boolean(i))
  const criteria = criteriaFromViews(viewed)
  if (!criteria) return null

  const mid = criteria.minPrice !== undefined && criteria.maxPrice !== undefined
    ? (criteria.minPrice / 0.7 + criteria.maxPrice / 1.2) / 2
    : 0
  const scored = snapshot.items
    .filter((i) => !seen.has(i.slug))
    .map((item) => ({ item, score: scoreItem(item, criteria) }))
    .filter((s) => s.score >= 0)

  const sinceMs = since?.getTime() ?? NaN
  const freshAll = Number.isFinite(sinceMs)
    ? scored
        .filter((s) => s.score >= FRESH_MIN_SCORE && s.item.createdAt && Date.parse(s.item.createdAt) > sinceMs)
        .sort((a, b) => b.score - a.score || Date.parse(b.item.createdAt) - Date.parse(a.item.createdAt))
    : []
  const fresh = freshAll.slice(0, MAX_FRESH).map((s) => s.item.slug)
  const shown = new Set(fresh)

  const picks = scored
    .filter((s) => s.score >= PICK_MIN_SCORE && !shown.has(s.item.slug))
    .sort((a, b) => b.score - a.score || Math.abs(a.item.price - mid) - Math.abs(b.item.price - mid))
    .slice(0, MAX_PICKS)
    .map((s) => s.item.slug)

  return { criteria, picks, fresh, freshCount: freshAll.length }
}
