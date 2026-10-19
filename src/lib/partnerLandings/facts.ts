/**
 * What a partner landing says, worked out from its listings. Pure: the query
 * fetches rows, this summarises, the page words it through `messages`.
 *
 * The same two rules as the listing depth blocks: no figure without data (a
 * median over fewer than `MIN_STAT_LISTINGS` flats is left out, a block with
 * no fact is not rendered), and nothing invented — every sentence on the page
 * traces back to a field on a listing.
 */
import { median, pricesPerSqm, totalPrices, MIN_PLAUSIBLE_AREA_SQM } from "@/lib/catalog/listingPriceSummary";
import { MIN_STAT_LISTINGS } from "@/lib/catalog/listingDepth";
import { KNOWN_COMPLEXES, PARTNER_LANDING_GRID_SIZE, type PartnerLanding, type PartnerLandingComplex } from "./config";

/** What the facts need from one listing. */
export type PartnerListingRow = {
  slug: string;
  price?: number | null;
  priceUnit?: string | null;
  area?: number | null;
  bedrooms?: number | null;
  typeSlug?: string | null;
  constructionStage?: string | null;
  handoverYear?: number | null;
  seaDistanceMeters?: number | null;
  beachfront?: boolean | null;
  /** Sanity `_createdAt`. */
  createdAt?: string | null;
  /** `exact` when the pin is the building. */
  locationLevel?: string | null;
  galleryCount?: number | null;
  /** English title and description, for the complex names. */
  textEn?: string | null;
  heroImageUrl?: string | null;
  heroImageWidth?: number | null;
};

/** `null` for "no sea distance stated", so a missing field is never read as 0 m. */
export const NEAR_SEA_METERS = 300;

/** Listings this landing is about: the place's, narrowed to the complex when the page is one. */
export function selectPartnerListings<T extends PartnerListingRow>(rows: readonly T[], landing: PartnerLanding): T[] {
  if (!landing.complex) return [...rows];
  const { pattern } = landing.complex;
  return rows.filter((r) => pattern.test(r.textEn ?? ""));
}

export type LayoutKey = "studio" | "1" | "2" | "3";

export type LayoutFacts = {
  layout: LayoutKey;
  count: number;
  areaMin: number | null;
  areaMax: number | null;
  priceFrom: number | null;
  /** Only over `MIN_STAT_LISTINGS` flats with a usable area. */
  medianPricePerSqm: number | null;
};

export type StageFacts = {
  completed: number;
  unfinished: number;
  unknown: number;
  /** Promised handover years of the unfinished ones, ascending, unique. */
  handoverYears: number[];
};

export type SeaFacts = {
  /** Listings with a stated distance. */
  known: number;
  within300: number;
  within1000: number;
  min: number;
  median: number;
};

export type ComplexMention = { name: string; count: number };

export type PartnerSelectionFacts = {
  count: number;
  /** Lowest total asking price, `null` when nothing has one. */
  priceFrom: number | null;
  /** Over `MIN_STAT_LISTINGS` listings, else `null`. */
  medianPricePerSqm: number | null;
  medianPrice: number | null;
  layouts: LayoutFacts[];
  stage: StageFacts;
  /** `null` when fewer than `MIN_STAT_LISTINGS` listings state a distance. */
  sea: SeaFacts | null;
  /** Complexes at least two listings name, most mentioned first. */
  complexes: ComplexMention[];
  /** ISO date of the newest listing. */
  newestAt: string | null;
};

function layoutOf(row: PartnerListingRow): LayoutKey | null {
  if (row.typeSlug === "studio") return "studio";
  const b = row.bedrooms;
  if (typeof b !== "number" || !Number.isFinite(b)) return null;
  if (b <= 0) return "studio";
  if (b === 1) return "1";
  if (b === 2) return "2";
  return "3";
}

const LAYOUT_ORDER: readonly LayoutKey[] = ["studio", "1", "2", "3"];

function plausibleAreas(rows: readonly PartnerListingRow[]): number[] {
  return rows
    .map((r) => r.area)
    .filter((a): a is number => typeof a === "number" && Number.isFinite(a) && a >= MIN_PLAUSIBLE_AREA_SQM);
}

function lowestTotal(rows: readonly PartnerListingRow[]): number | null {
  const totals = totalPrices(rows);
  return totals.length ? Math.min(...totals) : null;
}

export function layoutFacts(rows: readonly PartnerListingRow[]): LayoutFacts[] {
  const groups = new Map<LayoutKey, PartnerListingRow[]>();
  for (const row of rows) {
    const key = layoutOf(row);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return LAYOUT_ORDER.flatMap((layout) => {
    const group = groups.get(layout);
    if (!group || group.length === 0) return [];
    const areas = plausibleAreas(group);
    const perSqm = pricesPerSqm(group);
    return [
      {
        layout,
        count: group.length,
        areaMin: areas.length ? Math.min(...areas) : null,
        areaMax: areas.length ? Math.max(...areas) : null,
        priceFrom: lowestTotal(group),
        medianPricePerSqm: perSqm.length >= MIN_STAT_LISTINGS ? median(perSqm) : null,
      },
    ];
  });
}

export function stageFacts(rows: readonly PartnerListingRow[]): StageFacts {
  let completed = 0;
  let unfinished = 0;
  let unknown = 0;
  const years = new Set<number>();
  for (const row of rows) {
    const stage = row.constructionStage;
    if (stage === "completed") completed += 1;
    else if (stage === "under-construction" || stage === "off-plan") {
      unfinished += 1;
      if (typeof row.handoverYear === "number" && Number.isFinite(row.handoverYear)) years.add(row.handoverYear);
    } else unknown += 1;
  }
  return { completed, unfinished, unknown, handoverYears: [...years].sort((a, b) => a - b) };
}

export function seaFacts(rows: readonly PartnerListingRow[]): SeaFacts | null {
  const distances = rows
    .map((r) => (r.beachfront && typeof r.seaDistanceMeters !== "number" ? 0 : r.seaDistanceMeters))
    .filter((d): d is number => typeof d === "number" && Number.isFinite(d) && d >= 0);
  if (distances.length < MIN_STAT_LISTINGS) return null;
  return {
    known: distances.length,
    within300: distances.filter((d) => d <= NEAR_SEA_METERS).length,
    within1000: distances.filter((d) => d <= 1000).length,
    min: Math.min(...distances),
    median: median(distances) ?? 0,
  };
}

/** Complexes named by at least two listings, excluding the page's own complex. */
export function complexMentions(
  rows: readonly PartnerListingRow[],
  exclude?: PartnerLandingComplex | null,
  known: readonly PartnerLandingComplex[] = KNOWN_COMPLEXES,
): ComplexMention[] {
  const out: ComplexMention[] = [];
  for (const complex of known) {
    if (exclude && complex.name === exclude.name) continue;
    const count = rows.filter((r) => complex.pattern.test(r.textEn ?? "")).length;
    if (count >= 2) out.push({ name: complex.name, count });
  }
  return out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function summarizePartnerSelection(rows: readonly PartnerListingRow[], landing: PartnerLanding): PartnerSelectionFacts {
  const perSqm = pricesPerSqm(rows);
  const totals = totalPrices(rows);
  const enough = rows.length >= MIN_STAT_LISTINGS;
  const newest = rows
    .map((r) => r.createdAt)
    .filter((d): d is string => typeof d === "string" && d.length > 0)
    .sort()
    .at(-1);
  return {
    count: rows.length,
    priceFrom: lowestTotal(rows),
    medianPricePerSqm: enough && perSqm.length >= MIN_STAT_LISTINGS ? median(perSqm) : null,
    medianPrice: enough && totals.length >= MIN_STAT_LISTINGS ? median(totals) : null,
    layouts: layoutFacts(rows),
    stage: stageFacts(rows),
    sea: seaFacts(rows),
    complexes: complexMentions(rows, landing.complex),
    newestAt: newest ?? null,
  };
}

/**
 * How the selection's median sits against the place's: a whole percentage,
 * negative when cheaper. `null` without both medians.
 */
export function percentVsPlace(selectionMedian: number | null, placeMedian: number | null): number | null {
  if (!selectionMedian || !placeMedian || placeMedian <= 0) return null;
  return Math.round(((selectionMedian - placeMedian) / placeMedian) * 100);
}

/**
 * The listing whose photograph opens the page: a building pin and the most
 * photographs, so the hero shows the place itself rather than a district
 * marker's stock picture. A photo narrower than 1200px is left to the cards.
 */
export function pickHeroListing<T extends PartnerListingRow>(rows: readonly T[]): T | null {
  const candidates = rows.filter((r) => r.heroImageUrl && (r.heroImageWidth ?? 0) >= 1200);
  if (candidates.length === 0) return null;
  const score = (r: T) => (r.locationLevel === "exact" ? 1000 : 0) + Math.min(r.galleryCount ?? 0, 30);
  return [...candidates].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Cards in the order the page shows them: priced listings with a building pin
 * first, then the rest, newest first within each group; `limit` of them.
 */
export function orderForGrid<T extends PartnerListingRow>(rows: readonly T[], limit = PARTNER_LANDING_GRID_SIZE): T[] {
  const rank = (r: T) => (r.locationLevel === "exact" ? 2 : 0) + (typeof r.price === "number" && r.price > 0 ? 1 : 0);
  return [...rows]
    .sort((a, b) => rank(b) - rank(a) || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, limit);
}
