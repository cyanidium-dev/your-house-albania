/**
 * The arithmetic of the Albanian reference price, as the official texts set
 * it (research: reports/domlivo-seo-lab/research/reference-prices-official.md).
 * Pure functions, ALL in and ALL out; the page converts to EUR for display.
 *
 * - Reference value of a flat: m² × price, less 1% for each full year since
 *   the title was first acquired, at most 30% (Udhëzim i përbashkët 34/2023).
 * - Deemed sale value: the contract price, or the reference value when it is
 *   higher (same instruction).
 * - Capital-gains tax of an individual seller: 15% of deemed sale value minus
 *   purchase value, never below zero (Law 29/2023 art. 17).
 * - 2026 revaluation: 5% of the new value minus the last registered value
 *   (Law 85/2025, Udhëzim i përbashkët 5/2026); the new value is never below
 *   the reference value.
 * - Annual building tax: 0.05% of the value for a home (VKM 132/2018 art. 2);
 *   municipalities may move it by up to 30% either way, so it is an estimate.
 */

export const MAX_DEPRECIATION = 0.3;
export const DEPRECIATION_PER_YEAR = 0.01;
export const CAPITAL_GAINS_RATE = 0.15;
export const REVALUATION_RATE = 0.05;
export const BUILDING_TAX_RATE = 0.0005;
export const MUNICIPAL_ADJUSTMENT = 0.3;

export type ReferenceInput = {
  /** Reference price of the zone, ALL per m². */
  pricePerSqm: number;
  sqm: number;
  /** Full years since the title was first acquired. */
  years: number;
  /** Price in the sale contract, ALL; 0 when not known. */
  contractPrice: number;
  /** What the seller paid (or the last registered value), ALL; 0 when not known. */
  purchasePrice: number;
};

export type ReferenceResult = {
  depreciation: number;
  referenceValue: number;
  deemedSaleValue: number;
  /** True when the reference value, not the contract price, is the tax base. */
  referenceApplies: boolean;
  capitalGainsTax: number | null;
  /** Revaluing at the contract (market) price in 2026: 5% instead of 15% later. */
  revaluationTax: number | null;
  buildingTaxYear: { low: number; mid: number; high: number };
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const nonNegative = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function computeReference(input: ReferenceInput): ReferenceResult {
  const sqm = nonNegative(input.sqm);
  const price = nonNegative(input.pricePerSqm);
  const years = Math.floor(nonNegative(input.years));
  const contract = nonNegative(input.contractPrice);
  const purchase = nonNegative(input.purchasePrice);

  const depreciation = clamp(years * DEPRECIATION_PER_YEAR, 0, MAX_DEPRECIATION);
  const referenceValue = Math.round(sqm * price * (1 - depreciation));
  const deemedSaleValue = Math.max(contract, referenceValue);
  const capitalGainsTax = purchase > 0 ? Math.round(Math.max(deemedSaleValue - purchase, 0) * CAPITAL_GAINS_RATE) : null;
  const revaluationTax =
    purchase > 0 ? Math.round(Math.max(Math.max(contract, referenceValue) - purchase, 0) * REVALUATION_RATE) : null;
  // No transaction value: the building tax base is the reference value without depreciation.
  const base = contract > 0 ? contract : sqm * price;
  const mid = base * BUILDING_TAX_RATE;
  return {
    depreciation,
    referenceValue,
    deemedSaleValue,
    referenceApplies: referenceValue > contract,
    capitalGainsTax,
    revaluationTax,
    buildingTaxYear: {
      low: Math.round(mid * (1 - MUNICIPAL_ADJUSTMENT)),
      mid: Math.round(mid),
      high: Math.round(mid * (1 + MUNICIPAL_ADJUSTMENT)),
    },
  };
}
