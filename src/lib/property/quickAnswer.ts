import type { DistrictPriceRank } from "@/lib/property/ownershipCosts";

/**
 * The first paragraph of a listing page, in figures only: layout, area,
 * place, price and €/m², the listing's distance from the district median,
 * metres to the sea. The partner's description used to come first; a
 * searcher scans for exactly these numbers, Google takes the first paragraph
 * for the snippet, and the answer engines that already cite the city pages
 * cite sentences shaped like this (SEO hypothesis 7, 2026-10-19, tested on
 * the districts that have a reliable median).
 *
 * `null` when the page cannot say anything more than the fact row already
 * does: no price, no area, or no district median to compare with.
 */

export type QuickAnswerInput = {
  price?: number | null;
  priceUnit?: string | null;
  area?: number | null;
  beds?: number | null;
  rooms?: number | null;
  seaDistanceMeters?: number | null;
  /** The pin is the district centre, not the building: the distance gets a "≈". */
  seaApproximate?: boolean;
  /** District (or city) name in the page locale; the sentence names the place. */
  place: string | null;
  districtRank: DistrictPriceRank | null;
};

export type QuickAnswerText = {
  /** "2+1, 104 m², Golem, Durrës: 118 000 € (1 135 €/m²)." */
  intro: (args: { layout: string; area: number; place: string; price: string; rate: string }) => string;
  introNoLayout: (args: { area: number; place: string; price: string; rate: string }) => string;
  /** " 12 % below the district median of 1 290 €/m² across 73 listings." */
  median: (args: { pct: number; cmp: "below" | "above"; median: string; count: number }) => string;
  medianSame: (args: { median: string; count: number }) => string;
  /** " 250 m to the sea." / " ≈ 300 m to the sea." when the pin is approximate. */
  sea: (args: { m: number; approx: "yes" | "no" }) => string;
  bedrooms: (args: { count: number }) => string;
};

/** Albanian layout notation when the data has it: 2 bedrooms of 3 rooms → "2+1". */
export function layoutLabel(beds: number | null | undefined, rooms: number | null | undefined, text: Pick<QuickAnswerText, "bedrooms">): string | null {
  if (typeof beds !== "number" || beds <= 0) return null;
  if (typeof rooms === "number" && rooms > beds) return `${beds}+${rooms - beds}`;
  return text.bedrooms({ count: beds });
}

function totalPrice(input: QuickAnswerInput): number | null {
  const { price, priceUnit, area } = input;
  if (typeof price !== "number" || !(price > 0)) return null;
  if (priceUnit === "per-sqm") return typeof area === "number" && area > 0 ? price * area : null;
  return price;
}

function ratePerSqm(input: QuickAnswerInput): number | null {
  const { price, priceUnit, area } = input;
  if (typeof price !== "number" || !(price > 0)) return null;
  if (priceUnit === "per-sqm") return price;
  return typeof area === "number" && area > 0 ? price / area : null;
}

/** Below ±1 % the honest word is "at the median", not a decimal. */
const SAME_AS_MEDIAN_PCT = 1;

export function buildQuickAnswer(
  input: QuickAnswerInput,
  text: QuickAnswerText,
  money: (n: number) => string,
): string | null {
  const price = totalPrice(input);
  const rate = ratePerSqm(input);
  const area = typeof input.area === "number" && input.area > 0 ? Math.round(input.area) : null;
  const place = (input.place ?? "").trim();
  if (price === null || rate === null || area === null || !place || !input.districtRank) return null;

  const layout = layoutLabel(input.beds, input.rooms, text);
  const common = { area, place, price: money(price), rate: money(Math.round(rate)) };
  let s = layout ? text.intro({ layout, ...common }) : text.introNoLayout(common);

  const { diffPct, medianPerSqm, count } = input.districtRank;
  const pct = Math.round(Math.abs(diffPct));
  s +=
    Math.abs(diffPct) < SAME_AS_MEDIAN_PCT
      ? text.medianSame({ median: money(Math.round(medianPerSqm)), count })
      : text.median({ pct, cmp: diffPct < 0 ? "below" : "above", median: money(Math.round(medianPerSqm)), count });

  if (typeof input.seaDistanceMeters === "number" && input.seaDistanceMeters > 0) {
    s += text.sea({ m: Math.round(input.seaDistanceMeters), approx: input.seaApproximate ? "yes" : "no" });
  }
  return s;
}
