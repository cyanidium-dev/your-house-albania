/**
 * Rental ROI calculator — pure module, no React.
 * EUR base currency. Formula (per spec, a deliberate simplification):
 * gross annual income → minus management fee % → minus tax % (applied to the
 * post-management amount) → net annual income; yields are % of property price.
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

export type RoiResult = {
  grossAnnualEur: number
  mgmtFeeEur: number
  taxEur: number
  netAnnualEur: number
  grossYieldPct: number
  netYieldPct: number
  /** STR only: nights used after occupancy + seasonal cap. */
  nightsUsed?: number
}

export function calculateRoi(input: RoiInput): RoiResult | null {
  const price = Number(input.priceEur)
  if (!Number.isFinite(price) || price <= 0) return null

  let grossAnnualEur = 0
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
  } else {
    const monthlyRent = Math.max(0, Number(input.monthlyRentEur) || 0)
    if (monthlyRent <= 0) return null
    grossAnnualEur = monthlyRent * 12
  }

  const mgmtFeeEur = (grossAnnualEur * clampPct(input.mgmtFeePct)) / 100
  const afterMgmtEur = grossAnnualEur - mgmtFeeEur
  const taxEur = (afterMgmtEur * clampPct(input.taxRatePct)) / 100
  const netAnnualEur = afterMgmtEur - taxEur

  return {
    grossAnnualEur,
    mgmtFeeEur,
    taxEur,
    netAnnualEur,
    grossYieldPct: (grossAnnualEur / price) * 100,
    netYieldPct: (netAnnualEur / price) * 100,
    ...(nightsUsed !== undefined ? { nightsUsed } : {}),
  }
}

function clampPct(raw: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}
