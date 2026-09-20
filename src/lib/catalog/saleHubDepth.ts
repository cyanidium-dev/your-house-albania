/**
 * What the national `/sale` hub says under its card grid — prices across the
 * country, its cities, its property types — worked out from data the page
 * already has. No I/O and no copy, like `listingDepth`, and the same two rules:
 * - no number without data: a city or a type with fewer than
 *   `MIN_STAT_LISTINGS` homes is left out, a median over fewer flats is blank;
 * - a link only to a page we ask Google to index in this locale. A city page is
 *   the SEO registry's call (ADR 004); a national `/sale/{type}` page follows
 *   the inventory rule its own robots tag follows. Everything else is text.
 */
import {
  MIN_STAT_LISTINGS,
  districtLinkTargets,
  printablePriceFacts,
  type DecisionRow,
  type DistrictLinkTarget,
} from "@/lib/catalog/listingDepth";
import type { FlatPriceSummary } from "@/lib/catalog/listingPriceSummary";
import { isSeoPageIndexableIn } from "@/lib/seo/pages";
import { isNationalTypeListingThin } from "@/lib/seo/listingIndexPolicy";

export type HubCityPriceRow = FlatPriceSummary & { citySlug: string };

export type HubCity = {
  citySlug: string;
  /** From the registry; `null` when the city has no decision (then it is never linked). */
  countrySlug: string | null;
  count: number;
  /** Blank unless the city has enough flats for a median to mean something. */
  medianFlatPrice: number | null;
  medianFlatPricePerSqm: number | null;
  /** A row of the price table: enough flats, and at least one figure to show. */
  inPriceTable: boolean;
  /** Link it only when the registry indexes the city's listing page in this locale. */
  linkable: boolean;
};

/** Cities of the hub, largest first, each with what may be printed about it. */
export function hubCities(input: {
  cities: readonly HubCityPriceRow[];
  rows: readonly DecisionRow[];
  locale: string;
}): HubCity[] {
  const out: HubCity[] = [];
  for (const city of input.cities) {
    const facts = printablePriceFacts(city);
    if (!facts) continue;
    const slug = city.citySlug.toLowerCase();
    const row = input.rows.find((r) => r.decision.key.family === "city" && r.decision.key.city === slug);
    out.push({
      citySlug: slug,
      countrySlug: row ? row.decision.key.country : null,
      count: facts.count,
      medianFlatPrice: facts.medianFlatPrice,
      medianFlatPricePerSqm: facts.medianFlatPricePerSqm,
      inPriceTable:
        facts.flatCount >= MIN_STAT_LISTINGS && (facts.medianFlatPrice !== null || facts.medianFlatPricePerSqm !== null),
      linkable: row ? isSeoPageIndexableIn(row.decision, input.locale) : false,
    });
  }
  return out.sort((a, b) => b.count - a.count || a.citySlug.localeCompare(b.citySlug));
}

/** The hub names a city's districts only while the list stays a glance, not a directory. */
export const HUB_DISTRICTS_PER_CITY = 8;

export type HubCityDistricts = { citySlug: string; countrySlug: string; districts: DistrictLinkTarget[] };

/**
 * Main districts of the cities the hub links to — in practice Durrës, where the
 * stock is. Only indexable district pages (they are links), largest first.
 */
export function hubCityDistricts(input: {
  cities: readonly HubCity[];
  rows: readonly DecisionRow[];
  locale: string;
}): HubCityDistricts[] {
  return input.cities.flatMap((city) => {
    const country = city.countrySlug;
    if (!city.linkable || !country) return [];
    const districts = districtLinkTargets({
      rows: input.rows,
      place: { country, city: city.citySlug },
      locale: input.locale,
    })
      .filter((d) => d.count >= MIN_STAT_LISTINGS)
      .slice(0, HUB_DISTRICTS_PER_CITY);
    return districts.length > 0 ? [{ citySlug: city.citySlug, countrySlug: country, districts }] : [];
  });
}

export type HubType = {
  typeSlug: string;
  count: number;
  /** `/sale/{type}` exists for every type; link it only when that page is indexed. */
  linkable: boolean;
};

/**
 * Property types of the hub, largest first. `hubNoindex` is the CMS switch
 * that noindexes the whole national catalogue, type pages included.
 */
export function hubTypes(input: {
  types: readonly { typeSlug: string; count: number }[];
  hubNoindex: boolean;
}): HubType[] {
  return input.types
    .filter((t) => t.typeSlug && t.count >= MIN_STAT_LISTINGS)
    .map((t) => ({
      typeSlug: t.typeSlug.toLowerCase(),
      count: t.count,
      linkable: !input.hubNoindex && !isNationalTypeListingThin(t.count),
    }))
    .sort((a, b) => b.count - a.count || a.typeSlug.localeCompare(b.typeSlug));
}
