/**
 * The figures of a landing's inventory band: how many listings a filter
 * matches, the lowest total asking price, the median EUR/m², and which share
 * is near the sea or still being built. Pure — the query fetches the rows,
 * this summarises them with the same arithmetic as every other price figure
 * on the site (`listingPriceSummary`).
 */

import { NEAR_SEA_MAX_METERS } from '@/lib/catalog/listingFacets'
import { median, pricesPerSqm, totalPrices, type ListingPriceRow } from '@/lib/catalog/listingPriceSummary'

export type InventoryRow = ListingPriceRow & {
  seaDistanceMeters?: number | null
  beachfront?: boolean | null
  constructionStage?: string | null
}

export type InventorySummary = {
  count: number
  /** Lowest total asking price; per-m² rates are not totals. */
  fromPrice: number | null
  medianPricePerSqm: number | null
  /** 0–100, rounded; `null` when nothing matched. */
  nearSeaShare: number | null
  newBuildShare: number | null
}

export const INVENTORY_METRICS = [
  'count',
  'fromPrice',
  'medianPricePerSqm',
  'nearSeaShare',
  'newBuildShare',
] as const

export type InventoryMetric = (typeof INVENTORY_METRICS)[number]

export function isInventoryMetric(v: unknown): v is InventoryMetric {
  return typeof v === 'string' && (INVENTORY_METRICS as readonly string[]).includes(v)
}

const NEW_BUILD_STAGES: readonly string[] = ['off-plan', 'under-construction']

/** Same rule as the catalogue's `nearSea` filter. */
export function isNearSeaRow(row: InventoryRow): boolean {
  return (
    row.beachfront === true ||
    (typeof row.seaDistanceMeters === 'number' && row.seaDistanceMeters <= NEAR_SEA_MAX_METERS)
  )
}

export function isNewBuildRow(row: InventoryRow): boolean {
  return typeof row.constructionStage === 'string' && NEW_BUILD_STAGES.includes(row.constructionStage)
}

function share(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null
}

export function summarizeInventory(rows: readonly InventoryRow[]): InventorySummary {
  const totals = totalPrices(rows)
  return {
    count: rows.length,
    fromPrice: totals.length ? Math.min(...totals) : null,
    medianPricePerSqm: median(pricesPerSqm(rows)),
    nearSeaShare: share(rows.filter(isNearSeaRow).length, rows.length),
    newBuildShare: share(rows.filter(isNewBuildRow).length, rows.length),
  }
}
