/**
 * An honest `<lastmod>` for a Sanity document.
 *
 * `_updatedAt` moves on every write, and most writes to this dataset are not
 * edits: the partner import re-sets every field it owns on every run, the
 * locale scripts patch every document of a type in one pass, the slug
 * generator touched all 375 listings on 2026-09-18. On 2026-09-23 the property
 * sitemap carried five distinct `lastmod` values for 2,625 URLs, 79% of them
 * one second of that run — which tells a crawler nothing about which page
 * changed, so it ignores the field for the whole site.
 *
 * The rule: a `_updatedAt` that another document of the same fetch shares to
 * the second is a script run, not an edit — an editor cannot save two
 * documents in one second, and one Sanity transaction stamps every document
 * it touches with the same time. Such a timestamp is discarded and the
 * document's own dates stand in for it (`publishedAt`, `contentUpdatedAt`,
 * `_createdAt` — whatever the caller trusts, in order). Nothing known → no
 * `lastmod` at all; a made-up "now" is worse than silence.
 *
 * Known gap: an import that touches one listing per transaction still moves
 * that listing's `_updatedAt` to a distinct second, so the day after a partner
 * import every partner listing looks freshly edited. The fix is a
 * `contentUpdatedAt` the import sets only when the payload differs
 * (domlivo-admin scripts/importFindallListings.ts); this module prefers such a
 * field the day it exists.
 */

export type DatedRow = { _updatedAt?: string | null };

/** Parse an ISO date, `undefined` when absent or unreadable. */
export function parseDateOrUndefined(raw: string | Date | null | undefined): Date | undefined {
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? undefined : raw;
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * `_updatedAt` values that two or more of `rows` share, i.e. the timestamps
 * of script runs. Compare to the second: Sanity stores `_updatedAt` with
 * second precision, so equality is exact string equality after normalising.
 */
export function bulkTouchTimestamps(rows: ReadonlyArray<DatedRow>): Set<string> {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const key = normalizeTimestamp(row._updatedAt);
    if (!key) continue;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const bulk = new Set<string>();
  for (const [key, count] of seen) if (count >= 2) bulk.add(key);
  return bulk;
}

function normalizeTimestamp(raw: string | null | undefined): string | null {
  const d = parseDateOrUndefined(raw);
  return d ? d.toISOString().slice(0, 19) : null;
}

/**
 * The document's last content change as far as its dates can tell:
 * `_updatedAt` when it is an individual write, otherwise the first usable
 * fallback. `undefined` when nothing is known.
 */
export function contentLastmod(
  row: DatedRow,
  bulk: ReadonlySet<string>,
  ...fallbacks: Array<string | Date | null | undefined>
): Date | undefined {
  const key = normalizeTimestamp(row._updatedAt);
  if (key && !bulk.has(key)) return parseDateOrUndefined(row._updatedAt);
  for (const candidate of fallbacks) {
    const d = parseDateOrUndefined(candidate);
    if (d) return d;
  }
  return undefined;
}

/** Newest of the given dates; `undefined` when none is known. */
export function latestDate(...dates: Array<Date | undefined | null>): Date | undefined {
  let best: Date | undefined;
  for (const d of dates) {
    if (!d || Number.isNaN(d.getTime())) continue;
    if (!best || d > best) best = d;
  }
  return best;
}
