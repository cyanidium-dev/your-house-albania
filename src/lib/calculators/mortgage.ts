/**
 * Mortgage (annuity) calculator — pure module, no React.
 * All money values are EUR (project base currency); conversion happens at display time.
 */

export type MortgageInput = {
  /** Property price, EUR. <= 0 → null result. */
  priceEur: number
  /** Down payment as % of price (0–100). */
  downPaymentPct: number
  /** Annual interest rate, % (e.g. 5.5). */
  annualRatePct: number
  /** Loan term in years (> 0). */
  termYears: number
  /** Regulatory LTV cap, % (Bank of Albania: 85 first home / 80 second / 70–75 FX). */
  maxLtvPct: number
}

export type MortgageResult = {
  loanEur: number
  downPaymentEur: number
  monthlyPaymentEur: number
  totalPaidEur: number
  totalInterestEur: number
  /** Loan-to-value, % of price. */
  ltvPct: number
  /** True when LTV exceeds the configured regulatory cap (warning, not a hard block). */
  exceedsLtvLimit: boolean
}

export function calculateMortgage(input: MortgageInput): MortgageResult | null {
  const price = Number(input.priceEur)
  const termYears = Number(input.termYears)
  if (!Number.isFinite(price) || price <= 0) return null
  if (!Number.isFinite(termYears) || termYears <= 0) return null

  const downPaymentPct = clampPct(input.downPaymentPct)
  const annualRatePct = Math.max(0, Number(input.annualRatePct) || 0)

  const downPaymentEur = (price * downPaymentPct) / 100
  const loanEur = price - downPaymentEur
  const months = Math.round(termYears * 12)
  if (months <= 0) return null

  const monthlyRate = annualRatePct / 100 / 12
  // Zero-rate edge: plain amortization without interest.
  const monthlyPaymentEur =
    monthlyRate === 0
      ? loanEur / months
      : (loanEur * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))

  if (!Number.isFinite(monthlyPaymentEur)) return null

  const totalPaidEur = monthlyPaymentEur * months
  const ltvPct = 100 - downPaymentPct

  return {
    loanEur,
    downPaymentEur,
    monthlyPaymentEur,
    totalPaidEur,
    totalInterestEur: totalPaidEur - loanEur,
    ltvPct,
    exceedsLtvLimit: ltvPct > (Number(input.maxLtvPct) || 100) + 1e-9,
  }
}

function clampPct(raw: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}
