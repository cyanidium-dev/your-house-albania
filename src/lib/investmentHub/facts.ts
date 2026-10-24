/**
 * What the investment hub prints, from the Price Index and the rents table.
 * Pure: the queries fetch, this decides, `messages/*.json` words it. No
 * figure without data: a city gets a yield only when the index has a median
 * 1+1 price over `MIN_STAT_LISTINGS` flats and the data sheet has a rent.
 */
import { MIN_STAT_LISTINGS } from "@/lib/catalog/listingDepth";
import { calculateRoi } from "@/lib/calculators/roi";
import type { PriceIndexCity, PriceIndexSnapshot } from "@/lib/priceIndex/snapshot";
import { INVESTMENT_HUB_RENTS, RENTAL_INCOME_TAX_PCT } from "./config";

export type InvestmentCityRow = {
  slug: string;
  country: string;
  title?: unknown;
  /** Sale listings of every type. */
  listings: number;
  /** Flats with a usable €/m²: the sample behind the median. */
  count: number;
  /** Median asking €/m² of flats, `null` under `MIN_STAT_LISTINGS`. */
  medianPerSqm: number | null;
  /** Median asking €/m² of new builds (off-plan, under construction) and of completed stock. */
  newBuildPerSqm: number | null;
  completedPerSqm: number | null;
  /** Median total price of a 1+1 (the facet), else of any flat; `null` under `MIN_STAT_LISTINGS`. */
  oneBedPrice: number | null;
  oneBedIsFacet: boolean;
  /** Advertised 1+1 rent range, EUR a month, from the data sheet; `null` when it has none for the city. */
  rent: { min: number; max: number } | null;
  /** Gross yield range, % (twelve months of rent over the 1+1 price). */
  grossYield: { min: number; max: number } | null;
  /** Net yield range, % after a vacancy month, a half-month letting fee, running costs and 15 % tax (calculator model). */
  netYield: { min: number; max: number } | null;
  /** True from the index's headline floor (30 flats). */
  reliable: boolean;
};

const enough = (n: number) => n >= MIN_STAT_LISTINGS;
const round1 = (n: number) => Math.round(n * 10) / 10;

function yields(price: number, rent: number): { gross: number; net: number } | null {
  const r = calculateRoi({ priceEur: price, rentalType: "ltr", monthlyRentEur: rent, mgmtFeePct: 0, taxRatePct: RENTAL_INCOME_TAX_PCT });
  return r ? { gross: round1(r.grossYieldPct), net: round1(r.netYieldPct) } : null;
}

export function investmentCityRow(city: PriceIndexCity): InvestmentCityRow {
  const facet = city.facets["1-1"];
  const oneBedIsFacet = !!facet && enough(facet.count) && facet.medianFlatPrice !== null;
  const oneBedPrice = oneBedIsFacet ? facet!.medianFlatPrice : enough(city.count) ? city.medianFlatPrice : null;
  const rent = INVESTMENT_HUB_RENTS[city.slug] ?? null;
  let grossYield: InvestmentCityRow["grossYield"] = null;
  let netYield: InvestmentCityRow["netYield"] = null;
  if (oneBedPrice && rent) {
    const lo = yields(oneBedPrice, rent.min);
    const hi = yields(oneBedPrice, rent.max);
    if (lo && hi) {
      grossYield = { min: lo.gross, max: hi.gross };
      netYield = { min: lo.net, max: hi.net };
    }
  }
  return {
    slug: city.slug,
    country: city.country,
    title: city.title,
    listings: city.listings,
    count: city.count,
    medianPerSqm: enough(city.count) ? city.median : null,
    newBuildPerSqm: enough(city.newBuild.count) ? city.newBuild.median : null,
    completedPerSqm: enough(city.completed.count) ? city.completed.median : null,
    oneBedPrice,
    oneBedIsFacet,
    rent,
    grossYield,
    netYield,
    reliable: city.reliable,
  };
}

/**
 * The table: lead cities first in their order, then every other city with a
 * sample, most listings first. A city under `MIN_STAT_LISTINGS` priced flats
 * has no figure to print and gets no row.
 */
export function investmentCityRows(snapshot: PriceIndexSnapshot, leadCities: readonly string[]): InvestmentCityRow[] {
  const bySlug = new Map(snapshot.cities.filter((c) => c.listings > 0 && enough(c.count)).map((c) => [c.slug, c]));
  const lead = leadCities.flatMap((slug) => {
    const city = bySlug.get(slug);
    return city ? [investmentCityRow(city)] : [];
  });
  const rest = [...bySlug.values()]
    .filter((c) => !leadCities.includes(c.slug))
    .sort((a, b) => b.listings - a.listings || a.slug.localeCompare(b.slug))
    .map(investmentCityRow);
  return [...lead, ...rest];
}

/** The city with the highest gross yield ceiling among those with one; `null` when none has one. */
export function bestYieldCity(rows: readonly InvestmentCityRow[]): InvestmentCityRow | null {
  const withYield = rows.filter((r) => r.grossYield !== null);
  if (withYield.length === 0) return null;
  return withYield.reduce((best, r) => (r.grossYield!.max > best.grossYield!.max ? r : best));
}

/** The cheapest city per m² with a reliable headline sample; `null` when none qualifies. */
export function cheapestReliableCity(rows: readonly InvestmentCityRow[]): InvestmentCityRow | null {
  const ok = rows.filter((r) => r.reliable && r.medianPerSqm !== null);
  if (ok.length === 0) return null;
  return ok.reduce((best, r) => (r.medianPerSqm! < best.medianPerSqm! ? r : best));
}
