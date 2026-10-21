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
 * Since 2026-10-21 the partner agencies come first (owner: "Grinchenko and
 * Cactus at the start, then everyone else; Cactus has hundreds, so its best
 * ones"). Between the paid slots and the rotation sits a partner block:
 * every Grinchenko listing and Cactus's best quarter (at most 40), ranked by
 * `qualityScore` and dealt alternately. The rest of Cactus joins the rotation.
 *
 * Pure: the query fetches ids with the promotion tier, the agent and a few
 * quality signals, this decides the order, the page's documents are fetched
 * by id after.
 */

export type RotationRow = {
  _id: string;
  promoted?: boolean | null;
  promotionType?: string | null;
  /** Agency or agent slug; listings without one share a lane. */
  agent?: string | null;
  /** Quality signals for the partner block (all optional). */
  photos?: number | null;
  views?: number | null;
  saves?: number | null;
  price?: number | null;
  area?: number | null;
  createdAt?: string | null;
};

/**
 * Partner agencies shown before the rotation, by agent slug, with how much of
 * their stock goes in the block. `share` is the fraction of the agency's
 * matching listings (best first), `max` caps it. Hard-coded: docs/HANDOVER.md §3.
 */
export const FEATURED_AGENCIES: readonly { slug: string; share: number; max: number }[] = [
  { slug: "real-estate-al", share: 1, max: Infinity }, // Grinchenko Real Estate
  { slug: "cactus", share: 0.25, max: 40 }, // Cactus Real Estate
];

const DAY_MS = 86_400_000;

/**
 * How presentable a listing is, about 0-8: photos (up to 3), interest from
 * views and saves (up to 2), a stated price (1) and area (0.5), freshness in
 * its first month (up to 1), plus up to 0.75 of daily jitter so the partner
 * block is not the same twenty cards every day.
 */
export function qualityScore(row: RotationRow, seed: string, now: number = Date.parse(`${seed}T12:00:00Z`)): number {
  const photos = Math.min(Math.max(row.photos ?? 0, 0), 15) / 15;
  const interest = Math.min(Math.log1p(Math.max(row.views ?? 0, 0) + 3 * Math.max(row.saves ?? 0, 0)) / Math.log1p(200), 1);
  const priced = (row.price ?? 0) > 0 ? 1 : 0;
  const sized = (row.area ?? 0) > 0 ? 0.5 : 0;
  const created = row.createdAt ? Date.parse(row.createdAt) : NaN;
  const ageDays = Number.isFinite(created) ? Math.max(0, (now - created) / DAY_MS) : Infinity;
  const fresh = ageDays < 30 ? 1 - ageDays / 30 : 0;
  const jitter = (fnv1a(`q:${seed}:${row._id}`) / 0xffffffff) * 0.75;
  return 3 * photos + 2 * interest + priced + sized + fresh + jitter;
}

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
 * (the query ranks them by tier and `featuredOrder`), then the partner block,
 * then the rotation.
 */
export function rotateCatalog(rows: readonly RotationRow[], seed: string): string[] {
  const paid: string[] = [];
  const unpaid: RotationRow[] = [];
  for (const row of rows) {
    if (!row?._id) continue;
    if (isPaidSlot(row)) paid.push(row._id);
    else unpaid.push(row);
  }

  // Partner block: each featured agency's best listings, dealt alternately.
  const featuredLanes: string[][] = [];
  const inBlock = new Set<string>();
  for (const agency of FEATURED_AGENCIES) {
    const own = unpaid.filter((r) => r.agent === agency.slug);
    if (own.length === 0) continue;
    const take = Math.min(agency.max, Math.max(1, Math.ceil(own.length * agency.share)));
    const best = own
      .map((row) => ({ row, q: qualityScore(row, seed) }))
      .sort((a, b) => b.q - a.q || a.row._id.localeCompare(b.row._id))
      .slice(0, take)
      .map((x) => x.row._id);
    best.forEach((id) => inBlock.add(id));
    featuredLanes.push(best);
  }
  for (let i = 0; featuredLanes.some((lane) => i < lane.length); i += 1) {
    for (const lane of featuredLanes) if (i < lane.length) paid.push(lane[i]);
  }
  const rest = unpaid.filter((r) => !inBlock.has(r._id));

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
