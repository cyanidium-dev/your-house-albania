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
      .setIfMissing({ _type: 'viewCounter', kind, slug, total: 0, firstSeen: iso })
      .inc({ total: 1 })
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
      })
    } catch (err) {
      console.warn('[metrics] view counter write failed:', err)
    }
  }
}
