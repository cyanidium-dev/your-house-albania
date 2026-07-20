/**
 * Full purchase cost calculator — pure module, no React.
 * EUR base currency. Percent items are % of the property price with an optional
 * EUR cap (e.g. notary fee ceiling); fixed items are flat EUR amounts.
 */

export type PurchaseCostItem = {
  /** Display label (already localized by the caller). */
  label: string
  kind: 'percent' | 'fixed'
  /** Percent (for `percent`) or EUR amount (for `fixed`). */
  value: number
  /** Optional EUR ceiling for percent items. */
  capEur?: number
  /** Optional note (e.g. "paid by buyer by agreement"). */
  note?: string
}

export type PurchaseCostLine = {
  label: string
  amountEur: number
  /** True when a percent item hit its `capEur` ceiling. */
  capped: boolean
  note?: string
}

export type PurchaseCostResult = {
  lines: PurchaseCostLine[]
  totalCostsEur: number
  totalWithPriceEur: number
  /** Costs as % of the property price. */
  overheadPct: number
}

export function calculatePurchaseCost(
  priceEur: number,
  items: PurchaseCostItem[],
): PurchaseCostResult | null {
  const price = Number(priceEur)
  if (!Number.isFinite(price) || price <= 0) return null
  if (!Array.isArray(items) || items.length === 0) return null

  const lines: PurchaseCostLine[] = []
  let totalCostsEur = 0

  for (const item of items) {
    const value = Number(item.value)
    if (!Number.isFinite(value) || value < 0) continue

    let amountEur: number
    let capped = false
    if (item.kind === 'percent') {
      amountEur = (price * value) / 100
      const cap = Number(item.capEur)
      if (Number.isFinite(cap) && cap > 0 && amountEur > cap) {
        amountEur = cap
        capped = true
      }
    } else {
      amountEur = value
    }

    lines.push({
      label: item.label,
      amountEur,
      capped,
      ...(item.note ? { note: item.note } : {}),
    })
    totalCostsEur += amountEur
  }

  if (lines.length === 0) return null

  return {
    lines,
    totalCostsEur,
    totalWithPriceEur: price + totalCostsEur,
    overheadPct: (totalCostsEur / price) * 100,
  }
}
