import { describe, expect, it } from 'vitest'
import { calculateRoi } from './roi'

// The figures the landings quote (investment plan §3, "most likely", 1+1 in Durrës).
const base = { priceEur: 120_000, taxRatePct: 15 }

describe('rental yield', () => {
  it('nets ≈5.8% on a self-managed short let, not the 8% of gross minus tax', () => {
    const r = calculateRoi({ ...base, rentalType: 'str', adrEur: 68, occupancyPct: 47, seasonNightsCap: 180, mgmtFeePct: 0 })!
    expect(r.grossYieldPct).toBeCloseTo(9.72, 1)
    expect(r.netYieldPct).toBeGreaterThan(5.5)
    expect(r.netYieldPct).toBeLessThan(6.1)
  })

  it('nets ≈3.5% with a manager taking 25%', () => {
    const r = calculateRoi({ ...base, rentalType: 'str', adrEur: 68, occupancyPct: 47, seasonNightsCap: 180, mgmtFeePct: 25 })!
    expect(r.netYieldPct).toBeGreaterThan(3.2)
    expect(r.netYieldPct).toBeLessThan(3.8)
  })

  it('nets ≈2% on a long let at €400 a month', () => {
    const r = calculateRoi({ ...base, rentalType: 'ltr', monthlyRentEur: 400, mgmtFeePct: 0 })!
    expect(r.netYieldPct).toBeGreaterThan(1.8)
    expect(r.netYieldPct).toBeLessThan(2.4)
  })

  it('adds up: net = gross − let costs − management − running costs − tax', () => {
    const r = calculateRoi({ ...base, rentalType: 'str', adrEur: 80, occupancyPct: 60, mgmtFeePct: 20 })!
    expect(r.grossAnnualEur - r.letCostsEur - r.mgmtFeeEur - r.runningCostsEur - r.taxEur).toBeCloseTo(r.netAnnualEur, 6)
  })
})
