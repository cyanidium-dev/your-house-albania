/**
 * Rental ROI calculator — pure module, no React. EUR base currency.
 *
 * The waterfall of docs/seo/INVESTMENT-LANDINGS-PLAN-2026-10-08.md §3:
 * gross → platform fee and tourist tax (short lets) or vacancy and letting
 * fee (long lets) → management → running costs (utilities for short lets,
 * repairs, insurance, building tax) → 15% income tax on the rent net of the
 * platform/letting fees → net. Net yield is on the total invested: price plus
 * the usual buying costs.
 *
 * Until 2026-10-14 only management and tax came off, so the landings showed
 * "8.3% net" right under copy that (correctly) said "≈5.8% net".
 */

export type RoiInput = {
  /** Property price, EUR. <= 0 → null result. */
  priceEur: number
  rentalType: 'ltr' | 'str'
  /** LTR: monthly rent, EUR. */
  monthlyRentEur?: number
  /** STR: average daily rate, EUR. */
  adrEur?: number
  /** STR: occupancy, % (0–100). */
  occupancyPct?: number
  /** STR: optional cap on rentable nights per year (seasonal markets). */
  seasonNightsCap?: number
  /** Management fee, % of gross. */
  mgmtFeePct: number
  /** Rental income tax, % (Albania: 15% for both LTR and STR from 2026). */
  taxRatePct: number
}

/** Short lets: Airbnb/Booking host fees, % of gross (plan §3: €690 on €11,506). */
export const STR_PLATFORM_FEE_PCT = 6
/** Short lets: municipal overnight tax borne by the host, % of gross (€259 on €11,506). */
export const STR_LOCAL_TAX_PCT = 2.25
/** Short lets: utilities paid by the owner for a 1+1 in Durrës, EUR a year. */
export const STR_UTILITIES_EUR = 900
/** Repairs and wear, % of the price a year (€800 on a €110–120k flat). */
export const REPAIRS_PCT_OF_PRICE = 0.7
/** Insurance (€72) and building tax (€65), EUR a year. */
export const FIXED_OWNER_COSTS_EUR = 137
/** Long lets: one empty month a year and half a month's rent to the letting agent. */
export const LTR_VACANCY_MONTHS = 1
export const LTR_LETTING_FEE_MONTHS = 0.5
/** Buying costs on top of the price (notary 0.35% + agency 1%; ASHK, lawyer, translator €938). */
export const BUYING_COSTS_PCT = 1.35
export const BUYING_COSTS_FIXED_EUR = 938

export type RoiResult = {
  grossAnnualEur: number
  /** Short lets: platform fee + tourist tax. Long lets: vacancy + letting fee. */
  letCostsEur: number
  mgmtFeeEur: number
  /** Utilities (short lets), repairs, insurance, building tax. */
  runningCostsEur: number
  taxEur: number
  netAnnualEur: number
  grossYieldPct: number
  /** Net income ÷ (price + buying costs). */
  netYieldPct: number
  totalInvestedEur: number
  /** STR only: nights used after occupancy + seasonal cap. */
  nightsUsed?: number
}

export function calculateRoi(input: RoiInput): RoiResult | null {
  const price = Number(input.priceEur)
  if (!Number.isFinite(price) || price <= 0) return null

  let grossAnnualEur = 0
  let letCostsEur = 0
  let nightsUsed: number | undefined

  if (input.rentalType === 'str') {
    const adr = Math.max(0, Number(input.adrEur) || 0)
    const occupancy = clampPct(input.occupancyPct ?? 0)
    if (adr <= 0 || occupancy <= 0) return null
    let nights = (365 * occupancy) / 100
    const cap = Number(input.seasonNightsCap)
    if (Number.isFinite(cap) && cap > 0) nights = Math.min(nights, cap)
    nightsUsed = Math.round(nights)
    grossAnnualEur = adr * nights
    letCostsEur = (grossAnnualEur * (STR_PLATFORM_FEE_PCT + STR_LOCAL_TAX_PCT)) / 100
  } else {
    const monthlyRent = Math.max(0, Number(input.monthlyRentEur) || 0)
    if (monthlyRent <= 0) return null
    grossAnnualEur = monthlyRent * 12
    letCostsEur = monthlyRent * (LTR_VACANCY_MONTHS + LTR_LETTING_FEE_MONTHS)
  }

  const mgmtFeeEur = (grossAnnualEur * clampPct(input.mgmtFeePct)) / 100
  const runningCostsEur =
    (input.rentalType === 'str' ? STR_UTILITIES_EUR : 0) + (price * REPAIRS_PCT_OF_PRICE) / 100 + FIXED_OWNER_COSTS_EUR
  const taxEur = (Math.max(0, grossAnnualEur - letCostsEur) * clampPct(input.taxRatePct)) / 100
  const netAnnualEur = grossAnnualEur - letCostsEur - mgmtFeeEur - runningCostsEur - taxEur
  const totalInvestedEur = price * (1 + BUYING_COSTS_PCT / 100) + BUYING_COSTS_FIXED_EUR

  return {
    grossAnnualEur,
    letCostsEur,
    mgmtFeeEur,
    runningCostsEur,
    taxEur,
    netAnnualEur,
    grossYieldPct: (grossAnnualEur / price) * 100,
    netYieldPct: (netAnnualEur / totalInvestedEur) * 100,
    totalInvestedEur,
    ...(nightsUsed !== undefined ? { nightsUsed } : {}),
  }
}

function clampPct(raw: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}
