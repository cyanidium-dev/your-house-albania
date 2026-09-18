import { ALL_PER_EUR, annualUtilitiesEur, calculateUtilities, type UtilityCity } from '@/lib/calculators/utilities';

/**
 * What a listing costs beyond its price: the one-off fees of buying it and the
 * yearly cost of holding it, plus where its €/m² sits among the district's
 * other listings on the site.
 *
 * Partner listings share their photos and facts with the partner's own site;
 * these figures are computed per listing from the research database and our
 * own catalogue, so they exist nowhere else. Every rate cites the knowledge
 * fact it comes from (`dataIds`), the same way the utilities calculator does.
 *
 * No I/O. `null` wherever an honest figure can't be made.
 */

export type CostLineKey = 'notary' | 'registration' | 'agency' | 'propertyTax' | 'utilities';

export type CostLine = {
  key: CostLineKey;
  eur: number;
  dataIds: string[];
};

export type OwnershipCosts = {
  /** The unit's total price, EUR. Derived from the rate on a per-m² listing. */
  totalPriceEur: number;
  /** True when `totalPriceEur` is a per-m² rate × this unit's area. */
  totalFromRate: boolean;
  purchase: CostLine[];
  purchaseTotalEur: number;
  /** One-off costs as % of the price. */
  purchasePct: number;
  /** Yearly lines. Empty when neither tax nor utilities can be computed. */
  annual: CostLine[];
  monthlyEur: number | null;
};

/** Types a household lives in. Land, hotels and shops have other economics. */
const FLAT_TYPES = ['apartment', 'studio', 'penthouse'];
const HOUSE_TYPES = ['house', 'villa'];
const RESIDENTIAL_TYPES = new Set([...FLAT_TYPES, ...HOUSE_TYPES]);

/**
 * The types a listing's €/m² is fair to compare with: a flat against flats, a
 * house against houses (a plot makes a house's €/m² a different number).
 * `null` for anything that isn't a home.
 */
export function comparableTypeSlugs(typeSlug?: string | null): string[] | null {
  if (!typeSlug) return null;
  if (FLAT_TYPES.includes(typeSlug)) return FLAT_TYPES;
  if (HOUSE_TYPES.includes(typeSlug)) return HOUSE_TYPES;
  return null;
}

/** The utilities model is built for flats and houses, not for 600 m² buildings. */
const UTILITIES_MAX_AREA_M2 = 250;

/**
 * Notary fee for a sale contract, Ministry of Justice Order 279/2012
 * (DATA-PURCHASE-0001), by contract value in lek. The source leaves open
 * whether the bands are marginal; applying the band rate to the whole value
 * differs from the marginal reading by a few tens of euros at these prices.
 */
const NOTARY_BANDS_ALL: Array<{ upTo: number; pct: number }> = [
  { upTo: 6_000_000, pct: 0.35 },
  { upTo: 15_000_000, pct: 0.3 },
  { upTo: 50_000_000, pct: 0.28 },
  { upTo: 100_000_000, pct: 0.25 },
  { upTo: Infinity, pct: 0.23 },
];
const NOTARY_MIN_ALL = 100_000;

/** ASHK registration of a sale contract, 3,500 ALL (DATA-PURCHASE-0003). */
const REGISTRATION_ALL = 3_500;

/** Typical buyer-side agency commission, 1% (DATA-PURCHASE-0004). */
const AGENCY_BUYER_PCT = 1;

/** Annual tax on residential buildings, 0.05% of the reference value (DATA-TAX-0008). */
const PROPERTY_TAX_PCT = 0.05;

/** Occupants assumed by the running-cost line. */
const OCCUPANTS = 2;

const round = (value: number) => Math.round(value);

export function notaryFeeEur(priceEur: number): number | null {
  const priceAll = priceEur * ALL_PER_EUR;
  if (!Number.isFinite(priceAll) || priceAll < NOTARY_MIN_ALL) return null;
  const band = NOTARY_BANDS_ALL.find((b) => priceAll <= b.upTo) ?? NOTARY_BANDS_ALL[NOTARY_BANDS_ALL.length - 1];
  return (priceAll * band.pct) / 100 / ALL_PER_EUR;
}

export type OwnershipCostsInput = {
  price?: number | null;
  priceUnit?: string | null;
  area?: number | null;
  typeSlug?: string | null;
  utilityCity?: UtilityCity | null;
  /** State reference price, lek/m² (zoneMetrics), min/max when the zone spans several. */
  referencePriceMin?: number | null;
  referencePriceMax?: number | null;
};

export function computeOwnershipCosts(input: OwnershipCostsInput): OwnershipCosts | null {
  const { price, area, typeSlug } = input;
  if (typeof price !== 'number' || !(price > 0)) return null;
  if (typeof area !== 'number' || !(area > 0)) return null;
  if (!typeSlug || !RESIDENTIAL_TYPES.has(typeSlug)) return null;

  const totalFromRate = input.priceUnit === 'per-sqm';
  const totalPriceEur = totalFromRate ? price * area : price;

  const purchase: CostLine[] = [];
  const notary = notaryFeeEur(totalPriceEur);
  if (notary !== null) purchase.push({ key: 'notary', eur: round(notary), dataIds: ['DATA-PURCHASE-0001'] });
  purchase.push({ key: 'registration', eur: round(REGISTRATION_ALL / ALL_PER_EUR), dataIds: ['DATA-PURCHASE-0003'] });
  purchase.push({
    key: 'agency',
    eur: round((totalPriceEur * AGENCY_BUYER_PCT) / 100),
    dataIds: ['DATA-PURCHASE-0004'],
  });
  const purchaseTotalEur = purchase.reduce((sum, line) => sum + line.eur, 0);

  const annual: CostLine[] = [];
  const refs = [input.referencePriceMin, input.referencePriceMax].filter(
    (v): v is number => typeof v === 'number' && v > 0,
  );
  if (refs.length > 0) {
    const refLekPerM2 = refs.reduce((a, b) => a + b, 0) / refs.length;
    const taxEur = (refLekPerM2 * area * PROPERTY_TAX_PCT) / 100 / ALL_PER_EUR;
    annual.push({ key: 'propertyTax', eur: round(taxEur), dataIds: ['DATA-TAX-0008'] });
  }
  if (input.utilityCity && area <= UTILITIES_MAX_AREA_M2) {
    const utilities = annualUtilitiesEur({ city: input.utilityCity, sizeM2: area, occupants: OCCUPANTS });
    if (Number.isFinite(utilities) && utilities > 0) {
      // The yearly figure blends three seasons of the same model; its sources
      // are the lines of any one of them.
      const { lines } = calculateUtilities({
        city: input.utilityCity,
        sizeM2: area,
        occupants: OCCUPANTS,
        season: 'shoulder',
      });
      const dataIds = Array.from(new Set(lines.flatMap((line) => line.dataIds)));
      annual.push({ key: 'utilities', eur: round(utilities), dataIds });
    }
  }
  const annualTotal = annual.reduce((sum, line) => sum + line.eur, 0);

  return {
    totalPriceEur: round(totalPriceEur),
    totalFromRate,
    purchase,
    purchaseTotalEur,
    purchasePct: (purchaseTotalEur / totalPriceEur) * 100,
    annual,
    monthlyEur: annual.length > 0 ? round(annualTotal / 12) : null,
  };
}

export type DistrictPriceRank = {
  /** Median €/m² of the district's comparable listings. */
  medianPerSqm: number;
  /** Listings the median is taken over. */
  count: number;
  /** This listing's €/m² against the median, %; negative means cheaper. */
  diffPct: number;
};

/** Fewer listings than this and a district median says more about luck than the market. */
export const DISTRICT_RANK_MIN_LISTINGS = 8;

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Where a listing's €/m² sits against the median of the district's listings
 * on the site. The rows are `{price, priceUnit, area}` straight from the
 * catalogue; per-m² rows count as their rate.
 */
export function rankInDistrict(
  listing: { price?: number | null; priceUnit?: string | null; area?: number | null },
  rows: Array<{ price?: number | null; priceUnit?: string | null; area?: number | null }>,
): DistrictPriceRank | null {
  const rate = pricePerSqm(listing);
  if (rate === null) return null;
  const rates = rows
    .map(pricePerSqm)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  if (rates.length < DISTRICT_RANK_MIN_LISTINGS) return null;
  const med = median(rates);
  if (!(med > 0)) return null;
  return { medianPerSqm: med, count: rates.length, diffPct: ((rate - med) / med) * 100 };
}

function pricePerSqm(row: { price?: number | null; priceUnit?: string | null; area?: number | null }): number | null {
  const { price, area } = row;
  if (typeof price !== 'number' || !(price > 0)) return null;
  if (row.priceUnit === 'per-sqm') return price;
  if (typeof area !== 'number' || !(area > 0)) return null;
  return price / area;
}
