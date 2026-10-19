/**
 * The catalogue's default order: a fair rotation instead of "newest first".
 *
 * Listings arrive in partner batches of a hundred and more, so newest-first
 * handed the first screen — and the enquiries — to whichever agency uploaded
 * last (owner, 2026-10-19). Now the paid slots (promoted, premium, top, sale)
 * keep their place at the top, and everything else is dealt out like this:
 *
 * 1. shuffled by a hash of the day and the listing id — the same order for
 *    everyone all day (pages, "show more", crawlers and the cache agree),
 *    a different one tomorrow, no state anywhere;
 * 2. dealt round-robin across agencies, so twenty flats of one partner never
 *    run in a row and a partner with thirteen listings is on page one as
 *    often as one with three hundred, until its stock runs out.
 *
 * Pure: the query fetches ids with the promotion tier and the agent, this
 * decides the order, the page's documents are fetched by id after.
 */

export type RotationRow = {
  _id: string;
  promoted?: boolean | null;
  promotionType?: string | null;
  /** Agency or agent slug; listings without one share a lane. */
  agent?: string | null;
};

/** One order per UTC day. */
export function rotationSeed(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** FNV-1a, 32-bit: stable and dependency-free, enough to shuffle a list. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function isPaidSlot(row: RotationRow): boolean {
  return row.promoted === true || (typeof row.promotionType === "string" && row.promotionType.trim() !== "");
}

/**
 * The ids in their order for the day: paid slots first in the order given
 * (the query ranks them by tier and `featuredOrder`), then the rotation.
 */
export function rotateCatalog(rows: readonly RotationRow[], seed: string): string[] {
  const paid: string[] = [];
  const rest: RotationRow[] = [];
  for (const row of rows) {
    if (!row?._id) continue;
    if (isPaidSlot(row)) paid.push(row._id);
    else rest.push(row);
  }

  const shuffled = rest
    .map((row) => ({ row, h: fnv1a(`${seed}:${row._id}`) }))
    .sort((a, b) => a.h - b.h || a.row._id.localeCompare(b.row._id))
    .map((x) => x.row);

  // Lanes per agency, in the order the shuffle first shows each one, so the
  // lane order changes with the day too.
  const lanes = new Map<string, string[]>();
  for (const row of shuffled) {
    const key = row.agent ?? "";
    const lane = lanes.get(key);
    if (lane) lane.push(row._id);
    else lanes.set(key, [row._id]);
  }

  const out = paid;
  const queues = [...lanes.values()];
  let left = shuffled.length;
  while (left > 0) {
    for (const queue of queues) {
      const id = queue.shift();
      if (id !== undefined) {
        out.push(id);
        left -= 1;
      }
    }
  }
  return out;
}
