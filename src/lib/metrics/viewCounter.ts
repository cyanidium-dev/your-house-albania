/**
 * Server-side view counters.
 *
 * GA4 answers "how is traffic behaving"; it cannot answer "how many people have
 * seen this listing", because ad blockers and declined consent remove a large
 * and unevenly distributed slice of visitors. A number an agent is shown, or
 * that decides which listing gets promoted, has to be counted on the server.
 *
 * One document per counted thing, never a patch on the listing itself: writing
 * to `property` would add a revision to editorial content on every page view
 * and fight whoever has it open in Studio.
 */

import { getWriteClient } from '@/lib/sanity/writeClient'

export type ViewKind = 'property' | 'post'

export const VIEW_KINDS: readonly ViewKind[] = ['property', 'post']

/** Slugs come from a request body, and the id is built from one. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,120}$/

export function isViewKind(value: unknown): value is ViewKind {
  return typeof value === 'string' && (VIEW_KINDS as readonly string[]).includes(value)
}

export function isCountableSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value)
}

export function viewDocId(kind: ViewKind, slug: string): string {
  return `view-${kind}-${slug}`
}

/**
 * Adds one view. Never throws — a lost count is not worth a failed request,
 * and the page has already been served by the time this runs.
 */
export async function recordView(kind: ViewKind, slug: string, now = new Date()): Promise<void> {
  const client = getWriteClient()
  if (!client) return
  const id = viewDocId(kind, slug)
  const iso = now.toISOString()
  try {
    await client
      .patch(id)
      .setIfMissing({ _type: 'viewCounter', kind, slug, total: 0, firstSeen: iso, days: {} })
      // Daily buckets (UTC) since 2026-10-14, so "views this week" can be told
      // apart from a listing that was popular once; trimmed by pruneDays.
      .setIfMissing({ [`days.${dayKey(now)}`]: 0 })
      .inc({ total: 1, [`days.${dayKey(now)}`]: 1 })
      .set({ updatedAt: iso })
      .commit()
  } catch {
    // A patch against a document that does not exist yet fails instead of
    // creating it; seed it and let the next view increment normally.
    try {
      await client.createIfNotExists({
        _id: id,
        _type: 'viewCounter',
        kind,
        slug,
        total: 1,
        firstSeen: iso,
        updatedAt: iso,
        days: { [dayKey(now)]: 1 },
      })
    } catch (err) {
      console.warn('[metrics] view counter write failed:', err)
    }
  }
}

/** `d20261014`: a Sanity object key (no dashes, not starting with a digit). */
export function dayKey(at: Date): string {
  return `d${at.toISOString().slice(0, 10).replace(/-/g, '')}`
}

/** Views in the last `days` days (today included) from a counter's daily buckets. */
export function viewsInLastDays(buckets: Record<string, number> | null | undefined, days: number, now = new Date()): number {
  if (!buckets) return 0
  let sum = 0
  for (let i = 0; i < days; i++) {
    const n = buckets[dayKey(new Date(now.getTime() - i * 86_400_000))]
    if (typeof n === 'number' && n > 0) sum += n
  }
  return sum
}

/**
 * A visitor saved (+1) or unsaved (-1) a listing. Favourites live in the
 * browser; this keeps the count of how many browsers hold the listing, which
 * the cards show from a threshold. Never throws.
 */
export async function recordFavorite(slug: string, delta: 1 | -1, now = new Date()): Promise<void> {
  const client = getWriteClient()
  if (!client) return
  const id = viewDocId('property', slug)
  const iso = now.toISOString()
  try {
    await client
      .patch(id)
      .setIfMissing({ _type: 'viewCounter', kind: 'property', slug, total: 0, firstSeen: iso, favorites: 0 })
      .inc({ favorites: delta })
      .set({ updatedAt: iso })
      .commit()
  } catch {
    if (delta < 0) return
    try {
      await client.createIfNotExists({
        _id: id,
        _type: 'viewCounter',
        kind: 'property',
        slug,
        total: 0,
        favorites: 1,
        firstSeen: iso,
        updatedAt: iso,
      })
    } catch (err) {
      console.warn('[metrics] favourite counter write failed:', err)
    }
  }
}
